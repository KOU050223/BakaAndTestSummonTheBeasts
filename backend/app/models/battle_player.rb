class BattlePlayer < ApplicationRecord
  belongs_to :battle
  belongs_to :student, class_name: "User"
  has_many :battle_summons, dependent: :destroy

  validates :student_id, uniqueness: { scope: :battle_id }
end
