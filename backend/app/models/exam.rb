class Exam < ApplicationRecord
  # 科目コードの出典は Subject ドメインに一元化する。
  SUBJECTS = Subject::CODES

  has_one_attached :answer_key

  belongs_to :school_class
  belongs_to :created_by, class_name: "User"
  has_many :scores, dependent: :destroy
  has_many :exam_questions, dependent: :destroy
  has_many :answer_sheets, dependent: :destroy

  validates :title, presence: true
  validates :subject, inclusion: { in: SUBJECTS }
  validates :max_score, numericality: { greater_than: 0 }
end
