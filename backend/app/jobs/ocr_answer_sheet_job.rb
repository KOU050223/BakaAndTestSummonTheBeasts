class OcrAnswerSheetJob < ApplicationJob
  queue_as :default

  def perform(answer_sheet_id)
    answer_sheet = AnswerSheet.find(answer_sheet_id)
    return unless answer_sheet.image.attached?

    answer_sheet.image.open do |file|
      image_path = pdf?(file.path) ? convert_pdf(file.path) : file.path
      preprocessed = preprocess(image_path)
      text = RTesseract.new(preprocessed, lang: "jpn").to_s
      answer_sheet.update!(ocr_text: text, status: "ocr_done")
    end
  end

  private

  def pdf?(path)
    File.read(path, 4).start_with?("%PDF")
  end

  def convert_pdf(path)
    output = Tempfile.new([ "pdf_to_img_", ".png" ])
    image = MiniMagick::Image.open("#{path}[0]") # 1ページ目のみ
    image.format("png")
    image.write(output.path)
    output.path
  end

  def preprocess(path)
    image = MiniMagick::Image.open(path)
    image.auto_orient
    image.deskew("40%")
    image.colorspace("Gray")
    image.contrast
    output = Tempfile.new([ "ocr_", ".png" ])
    image.write(output.path)
    output.path
  end
end
