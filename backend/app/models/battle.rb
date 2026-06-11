class Battle < ApplicationRecord
  STATUSES = %w[waiting active finished].freeze
  SUBJECTS = Exam::SUBJECTS

  belongs_to :created_by, class_name: "User"
  belongs_to :winner, class_name: "User", optional: true
  has_many :battle_players, dependent: :destroy
  has_many :battle_logs, dependent: :destroy

  validates :subject, inclusion: { in: SUBJECTS }
  validates :status, inclusion: { in: STATUSES }
end
