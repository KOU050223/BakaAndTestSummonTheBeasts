# Go Game Server へ渡すバトル開始データ（docs/apiSpec.md §4, docs/ws-schema.md）。
#
# Go はこのデータでルームを初期化する：
# - fields: AR 床に配置する召喚フィールド（科目・中心座標・半径）
# - players: 各プレイヤーの科目別召喚獣スナップショット（科目ごと個別の初期 HP 等）
class BattleStartDataSerializer
  def initialize(battle)
    @battle = battle
  end

  def as_json(*)
    {
      battleId: @battle.id.to_s,
      fields: @battle.battle_fields.map { |f| field_json(f) },
      players: @battle.battle_players.map { |p| player_json(p) }
    }
  end

  private

  def field_json(field)
    {
      subject: field.subject,
      centerX: field.center_x,
      centerZ: field.center_z,
      radius: field.radius
    }
  end

  def player_json(player)
    {
      userId: player.student_id.to_s,
      name: player.student.name,
      summons: player.battle_summons.map { |s| summon_json(s) }
    }
  end

  def summon_json(summon)
    {
      subject: summon.subject,
      hp: summon.initial_hp,
      attack: summon.initial_attack,
      defense: summon.initial_defense,
      speed: summon.initial_speed
    }
  end
end
