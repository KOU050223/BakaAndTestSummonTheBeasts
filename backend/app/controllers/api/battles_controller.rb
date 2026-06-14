module Api
  # バトル一覧・作成・結果取得のスタブ。apiSpec.md §3.7, §3.8 準拠。
  # バトル進行は Go Game Server が担うため、Rails側は作成/結果の固定モックを返す。
  # TODO: Battle::Create UseCase（開始時ステータスのスナップショット保存）と
  #       結果取得の実データ化に差し替える（docs/backend-design.md §6.5）。
  class BattlesController < BaseController
    before_action -> { require_role!(:student, :teacher) }, only: %i[index create]
    before_action -> { require_role!(:student, :teacher) }, only: :result

    # 生徒ダッシュボードの「参加可能なバトル」バッジ表示用の一覧（screen-flow.md）。
    def index
      render json: {
        battles: [
          { battleId: "battle_1", subjectId: "math", status: "waiting", opponentName: "土屋康太" }
        ]
      }, status: :ok
    end

    def create
      render json: {
        battleId: "battle_1",
        subjectId: params[:subjectId] || "math",
        status: "waiting"
      }, status: :created
    end

    def result
      render json: {
        battleId: params[:id],
        winnerId: "user_1",
        loserId: "user_2",
        turnCount: 6,
        logs: [
          { turn: 1, actorId: "user_1", action: "attack", targetId: "user_2", damage: 24 },
          { turn: 2, actorId: "user_2", action: "attack", targetId: "user_1", damage: 18 }
        ]
      }, status: :ok
    end
  end
end
