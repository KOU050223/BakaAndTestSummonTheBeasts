# バトル結果（勝敗・ターン数・行動ログ）を返す（docs/apiSpec.md §3.8）。
class BattleResultSerializer
  def initialize(battle)
    @battle = battle
  end

  def as_json(*)
    loser = @battle.battle_players.map(&:student_id).find { |id| id != @battle.winner_id }

    {
      battleId: @battle.id.to_s,
      winnerId: @battle.winner_id&.to_s,
      loserId: loser&.to_s,
      turnCount: @battle.turn_count || 0,
      logs: @battle.battle_logs.order(:turn).map { |log| log_json(log) }
    }
  end

  private

  def log_json(log)
    {
      turn: log.turn,
      actorId: log.actor_id.to_s,
      action: log.action,
      targetId: log.target_id.to_s,
      damage: log.damage
    }
  end
end
