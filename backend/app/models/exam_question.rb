class ExamQuestion < ApplicationRecord
  belongs_to :exam

  validates :number, presence: true, uniqueness: { scope: :exam_id }
  validates :question_text, presence: true
  validates :model_answer, presence: true
  validates :points, presence: true, numericality: { greater_than: 0 }

  default_scope { order(:number) }
end
