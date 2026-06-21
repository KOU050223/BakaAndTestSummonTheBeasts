class User < ApplicationRecord
  has_secure_password

  ROLES = %w[student teacher school_admin].freeze

  has_one :class_membership, dependent: :destroy
  has_one :school_class, through: :class_membership

  has_many :scores, foreign_key: :student_id, dependent: :destroy
  has_many :summon_statuses, foreign_key: :student_id, dependent: :destroy
  has_many :battle_players, foreign_key: :student_id, dependent: :destroy
  has_many :push_subscriptions, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }

  before_save { self.email = email.downcase }
  validates :role, inclusion: { in: ROLES }
end
