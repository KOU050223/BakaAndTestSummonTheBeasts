class OcrAnswerKeyJob < ApplicationJob
  queue_as :default

  def perform(exam_id)
    exam = Exam.find(exam_id)
    return unless exam.answer_key.attached?
    # scored（採点確定済み）も対象に含める。
    # 解答キー差し替え時にAI判定結果を最新化し、教師が再確認できるようにする。
    exam.answer_sheets.where(status: %w[ocr_done scored]).each do |sheet|
      sheet.update!(ai_grading: nil)
      GradeAnswerSheetJob.perform_later(sheet.id)
    end
  end
end
