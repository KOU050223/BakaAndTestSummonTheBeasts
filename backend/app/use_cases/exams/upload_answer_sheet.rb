class Exams::UploadAnswerSheet
  def initialize(exam:, student:, image:)
    @exam = exam
    @student = student
    @image = image
  end

  def call
    sheet = AnswerSheet.find_or_initialize_by(exam: @exam, student: @student)
    sheet.status = "pending"
    sheet.ocr_text = nil
    sheet.image.attach(@image)
    sheet.save!
    OcrAnswerSheetJob.perform_later(sheet.id)
    sheet
  end
end
