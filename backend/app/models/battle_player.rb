class BattlePlayer < ApplicationRecord
  belongs_to :battle
  belongs_to :student, class_name: "User"

  validates :student_id, uniqueness: { scope: :battle_id }
  validates :initial_hp, :initial_attack, :initial_defense, :initial_speed,
            numericality: { greater_than_or_equal_to: 0 }
end
