class User < ApplicationRecord
  has_secure_password

  ROLES = %w[student teacher school_admin].freeze

  has_one :class_membership, dependent: :destroy
  has_one :school_class, through: :class_membership

  has_many :scores, foreign_key: :student_id, dependent: :destroy
  has_many :summon_statuses, foreign_key: :student_id, dependent: :destroy
  has_many :battle_players, foreign_key: :student_id, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: ROLES }
end
