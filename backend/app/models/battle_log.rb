class BattleLog < ApplicationRecord
  ACTIONS = %w[attack].freeze

  belongs_to :battle
  belongs_to :actor, class_name: "User"
  belongs_to :target, class_name: "User"

  validates :turn, numericality: { greater_than: 0 }
  validates :action, inclusion: { in: ACTIONS }
  validates :damage, numericality: { greater_than_or_equal_to: 0 }
end
