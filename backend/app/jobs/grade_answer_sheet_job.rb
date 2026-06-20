require "net/http"
require "base64"

class GradeAnswerSheetJob < ApplicationJob
  queue_as :grading

  # Gemini API / ネットワーク起因の一時的エラー。retry_on の対象にする。
  GeminiError = Class.new(StandardError)

  # 指数バックオフで最大3回リトライ。全消化後はブロックで failed に落とす。
  retry_on GeminiError, wait: :polynomially_longer, attempts: 3 do |job, error|
    sheet = AnswerSheet.find_by(id: job.arguments.first)
    sheet&.update!(ai_grading: { "status" => "failed" })
    Rails.logger.error "GradeAnswerSheetJob permanently failed after retries " \
                       "(sheet=#{job.arguments.first}): #{error.message}"
  end

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
  rescue GeminiError
    raise # retry_on に委譲する
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
      2つのファイルを採点してください。ファイルはPDFまたは画像（手書き答案を含む）です。

      【ファイル1】模範解答（各問の正答が書かれた解答一覧）
      【ファイル2】生徒の解答用紙（印刷済みまたは手書き）

      手順:
      1. ファイル1から「問番号→正答」の対応表を作る（例: 1→ア, 2→イ, ...）
      2. ファイル2から「問番号→生徒の解答」の対応表を作る（手書きの場合は最も読み取れた文字で判定）
      3. 同じ問番号同士で答えを比較する

      判定基準:
      - 答えが一致すれば true、不一致なら false
      - 2つのファイルが同一内容であればすべて true になる
      - 選択肢はア・イ・ウ・エ等。手書きで崩れていても最善推定で判定する

      以下のJSON形式のみを返してください（他のテキスト不要）:
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
    http.open_timeout = 10
    http.read_timeout = 60

    req = Net::HTTP::Post.new(uri)
    req["Content-Type"] = "application/json"
    req.body = body.to_json

    res  = http.request(req)
    json = JSON.parse(res.body)

    if json["error"]
      raise GeminiError, "Gemini API error #{json.dig('error', 'code')}: #{json.dig('error', 'message')}"
    end

    # Gemini 2.5 Flash (thinking model) may include a thought part before the JSON part.
    # Pick the last non-thought text part to get the actual structured output.
    parts = json.dig("candidates", 0, "content", "parts") || []
    text = parts.reject { |p| p["thought"] }.last&.dig("text").to_s
    Rails.logger.info "GradeAnswerSheetJob: Gemini response (truncated): #{text.truncate(300)}"

    raise GeminiError, "Gemini returned no parseable text (all parts were thought blocks?)" if text.blank?

    parsed = JSON.parse(text)
    raise GeminiError, "Gemini returned empty results" if parsed.empty?

    parsed.transform_keys(&:to_i)
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    raise GeminiError, "Gemini network timeout: #{e.message}"
  end
end
