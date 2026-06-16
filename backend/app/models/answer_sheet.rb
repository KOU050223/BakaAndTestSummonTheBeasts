class AnswerSheet < ApplicationRecord
  STATUSES = %w[pending ocr_done scored].freeze

  belongs_to :exam
  belongs_to :student, class_name: "User"

  has_one_attached :image

  validates :status, inclusion: { in: STATUSES }
  validates :student_id, uniqueness: { scope: :exam_id }

  def ocr_done!
    update!(status: "ocr_done")
  end

  def scored!
    update!(status: "scored")
  end
end
