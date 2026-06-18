class OcrAnswerKeyJob < ApplicationJob
  queue_as :default

  def perform(exam_id)
    exam = Exam.find(exam_id)
    return unless exam.answer_key.attached?
    exam.answer_sheets.where(status: "ocr_done").each do |sheet|
      sheet.update!(ai_grading: nil)
      GradeAnswerSheetJob.perform_later(sheet.id)
    end
  end
end
