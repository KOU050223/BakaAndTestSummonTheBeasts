class BattleSummon < ApplicationRecord
  SUBJECTS = Exam::SUBJECTS

  belongs_to :battle_player

  validates :subject, inclusion: { in: SUBJECTS }
  validates :subject, uniqueness: { scope: :battle_player_id }
  validates :initial_hp, :initial_attack, :initial_defense, :initial_speed,
            numericality: { greater_than_or_equal_to: 0 }
end
