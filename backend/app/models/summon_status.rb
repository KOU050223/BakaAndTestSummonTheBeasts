class SummonStatus < ApplicationRecord
  belongs_to :student, class_name: "User"

  validates :subject, presence: true
  validates :hp, :attack, :defense, :speed, numericality: { greater_than_or_equal_to: 0 }
  validates :student_id, uniqueness: { scope: :subject }
end
