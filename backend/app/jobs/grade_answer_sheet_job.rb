require "net/http"
require "base64"

class GradeAnswerSheetJob < ApplicationJob
  queue_as :default

  def perform(answer_sheet_id)
    sheet = AnswerSheet.find(answer_sheet_id)
    exam  = sheet.exam

    return unless exam.answer_key.attached? && sheet.image.attached?
    return if sheet.ai_grading&.dig("status") == "done"

    sheet.update!(ai_grading: { "status" => "processing" })

    key_img     = attachment_to_base64(exam.answer_key)
    student_img = attachment_to_base64(sheet.image)

    results = call_gemini(key_img, student_img)

    # 試験問題が未登録ならAI判定結果から問題数を自動生成
    if exam.exam_questions.count == 0
      max_q = results.keys.max || 0
      sync_exam_questions(exam, max_q) if max_q > 0
    end

    sheet.update!(ai_grading: { "status" => "done", "results" => results })
  rescue => e
    Rails.logger.error "GradeAnswerSheetJob failed (sheet=#{answer_sheet_id}): #{e.message}"
    sheet&.update!(ai_grading: { "status" => "failed" })
  end

  private

  def attachment_to_base64(attachment)
    ext = File.extname(attachment.filename.to_s).downcase.presence || ".pdf"
    Tempfile.create([ "grade_src_", ext ]) do |src|
      src.binmode
      src.write(attachment.download)
      src.flush
      mime = attachment.content_type.presence || "application/octet-stream"
      { data: Base64.strict_encode64(File.binread(src.path)), mime: mime }
    end
  end

  def sync_exam_questions(exam, count)
    pts = [ 1, 100 / count ].max
    ActiveRecord::Base.transaction do
      (1..count).each do |n|
        exam.exam_questions.find_or_create_by!(number: n) { |q| q.points = pts }
      end
      remain = 100 - pts * count
      exam.exam_questions.find_by!(number: count).increment!(:points, remain) if remain > 0
    end
  end

  def call_gemini(key_img, student_img)
    api_key = ENV.fetch("GEMINI_API_KEY")
    uri = URI(
      "https://generativelanguage.googleapis.com/v1beta/models/" \
      "gemini-2.5-flash:generateContent?key=#{api_key}"
    )

    prompt = <<~TEXT
      画像が2枚あります。
      【1枚目】試験の正答一覧（模範解答）
      【2枚目】生徒が提出した解答用紙

      手順:
      1. 1枚目から各問番号と正答の選択肢（ア・イ・ウ・エ 等）を正確に読み取る
      2. 2枚目から各問番号と生徒の解答の選択肢を正確に読み取る
      3. 問ごとに選択肢が**完全に一致**するか判定する

      重要:
      - 「ア」と「イ」は別物。文字が1文字でも違えば false にすること
      - 読み取れない・判断できない場合は false にすること
      - 2枚の画像が異なる年度・異なる試験であっても、問番号を合わせてそのまま比較すること

      全問を確認し、以下のJSON形式のみを返してください（説明文不要）:
      {"1": true, "2": false, "3": true, ...}
    TEXT

    body = {
      contents: [ {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: key_img[:mime],     data: key_img[:data] } },
          { inline_data: { mime_type: student_img[:mime], data: student_img[:data] } }
        ]
      } ],
      generationConfig: { temperature: 0, responseMimeType: "application/json" }
    }

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 60

    req = Net::HTTP::Post.new(uri)
    req["Content-Type"] = "application/json"
    req.body = body.to_json

    res  = http.request(req)
    json = JSON.parse(res.body)

    if json["error"]
      raise "Gemini API error #{json.dig('error', 'code')}: #{json.dig('error', 'message')}"
    end

    text = json.dig("candidates", 0, "content", "parts", 0, "text").to_s
    JSON.parse(text).transform_keys(&:to_i)
  end
end
