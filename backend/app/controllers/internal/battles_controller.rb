module Internal
  # Go Game Server 連携 internal API（docs/apiSpec.md §4）。
  # start-data: バトル開始時にフィールド配置・科目別召喚獣ステータスを Go へ渡す。
  # finish:     バトル終了時に勝敗・行動ログを Go から受け取り永続化する（冪等）。
  class BattlesController < BaseController
    def start_data
      battle = ::Battle.includes(battle_fields: [], battle_players: %i[student battle_summons]).find_by(id: params[:battle_id])
      return render json: { error: { code: "not_found", message: "battle not found" } }, status: :not_found if battle.nil?

      render json: BattleStartDataSerializer.new(battle), status: :ok
    end

    def finish
      battle = ::Battle.find_by(id: params[:battle_id])
      return render json: { error: { code: "not_found", message: "battle not found" } }, status: :not_found if battle.nil?

      Battles::Finish.new(
        battle: battle,
        winner_id: params[:winnerId],
        loser_id: params[:loserId],
        logs: finish_logs
      ).call

      render json: { battleId: battle.id.to_s, status: battle.reload.status }, status: :ok
    end

    private

    # ログ配列を symbol キーのハッシュ列へ正規化する（Battles::Finish の入力形式）。
    def finish_logs
      Array(params[:logs]).map do |log|
        {
          turn: log[:turn],
          actor_id: log[:actorId],
          target_id: log[:targetId],
          action: log[:action],
          damage: log[:damage]
        }
      end
    end
  end
end
