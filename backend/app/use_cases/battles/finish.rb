# バトル終了結果を Go Game Server から受け取り永続化する（docs/domain/contexts/battle.md）。
#
# Go から呼ばれる internal API のため冪等性が要件：既に finished のバトルに対する
# 再実行は no-op とし、二重保存・勝敗の上書きを行わない。
class Battles::Finish
  # @param battle [Battle] 対象バトル
  # @param winner_id [Integer] 勝者の生徒ID
  # @param loser_id [Integer] 敗者の生徒ID
  # @param logs [Array<Hash>] 行動ログ（turn/actor_id/target_id/action/damage を含むハッシュ列）
  def initialize(battle:, winner_id:, loser_id:, winner_team_id: nil, loser_team_id: nil, logs: [])
    @battle = battle
    @winner_id = winner_id
    @loser_id = loser_id
    @winner_team_id = winner_team_id
    @loser_team_id = loser_team_id
    @logs = Array(logs)
  end

  # @return [Battle]
  def call
    @battle.with_lock do
      # ロック取得時に最新状態へ再読み込みされるため、並行・遅延した再通知も no-op になる。
      return @battle if @battle.status == "finished"

      @logs.each { |log| create_log(log) }
      @battle.update!(
        status: "finished",
        winner_id: @winner_id,
        loser_id: @loser_id,
        winner_team_id: @winner_team_id,
        loser_team_id: @loser_team_id,
        turn_count: @logs.map { |l| l[:turn] || l["turn"] }.compact.max || 0
      )
      @battle
    end
  end

  private

  def create_log(log)
    @battle.battle_logs.create!(
      turn: log[:turn] || log["turn"],
      actor_id: log[:actor_id] || log["actor_id"],
      target_id: log[:target_id] || log["target_id"],
      action: log[:action] || log["action"],
      damage: log[:damage] || log["damage"]
    )
  end
end
