class Battle < ApplicationRecord
  STATUSES = %w[waiting active finished].freeze

  belongs_to :created_by, class_name: "User"
  belongs_to :winner, class_name: "User", optional: true
  belongs_to :loser, class_name: "User", optional: true
  belongs_to :winner_team, class_name: "SchoolClass", optional: true
  belongs_to :loser_team, class_name: "SchoolClass", optional: true
  has_many :battle_players, dependent: :destroy
  has_many :battle_fields, dependent: :destroy
  has_many :battle_logs, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }

  # このバトルで対戦する科目（配置された召喚フィールドの科目）。
  def subjects
    battle_fields.map(&:subject)
  end
end
