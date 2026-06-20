class BattleField < ApplicationRecord
  SUBJECTS = Exam::SUBJECTS

  belongs_to :battle

  validates :subject, inclusion: { in: SUBJECTS }
  validates :subject, uniqueness: { scope: :battle_id }
  validates :radius, numericality: { greater_than: 0 }
end
