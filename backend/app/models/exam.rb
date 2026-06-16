class Exam < ApplicationRecord
  SUBJECTS = %w[english math physics chemistry biology earth_science geography japanese_history world_history civics japanese].freeze

  belongs_to :school_class
  belongs_to :created_by, class_name: "User"
  has_many :scores, dependent: :destroy
  has_many :exam_questions, dependent: :destroy
  has_many :answer_sheets, dependent: :destroy

  validates :title, presence: true
  validates :subject, inclusion: { in: SUBJECTS }
  validates :max_score, numericality: { greater_than: 0 }
end
