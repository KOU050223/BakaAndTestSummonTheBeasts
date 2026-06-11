class SchoolClass < ApplicationRecord
  has_many :class_memberships, dependent: :destroy
  has_many :students, through: :class_memberships, source: :user
  has_many :exams, dependent: :destroy

  validates :name, presence: true, uniqueness: true
end
