class SchoolClass < ApplicationRecord
  has_many :class_memberships, dependent: :destroy
  has_many :students, through: :class_memberships, source: :user
  has_many :exams, dependent: :destroy

  validates :grade, presence: true, inclusion: { in: 1..3 }
  # 同名クラス（Aクラス等）は学年ごとに存在しうるため、学年スコープで一意にする。
  validates :name, presence: true, uniqueness: { scope: :grade }
end
