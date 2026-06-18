class OcrAnswerSheetJob < ApplicationJob
  queue_as :default

  def perform(answer_sheet_id)
    answer_sheet = AnswerSheet.find(answer_sheet_id)
    return unless answer_sheet.image.attached?
    answer_sheet.update!(status: "ocr_done")
    GradeAnswerSheetJob.perform_later(answer_sheet.id) if answer_sheet.exam.answer_key.attached?
  end
end
