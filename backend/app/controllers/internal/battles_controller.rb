module Internal
  # Go Game Server 連携 internal API のスタブ。apiSpec.md §4 準拠。
  # start-data: バトル開始時にプレイヤー情報・召喚獣ステータスをGoへ渡す。
  # finish:     バトル終了時に勝敗・ログをGoから受け取り永続化する。
  # TODO: Battle集約からの実データ取得・Battle::Finish UseCase（冪等）に差し替える。
  class BattlesController < BaseController
    def start_data
      math_a = Summon::StatusCalculator.call(82)
      math_b = Summon::StatusCalculator.call(55)

      render json: {
        battleId: params[:battle_id],
        subject: "math",
        players: [
          { userId: "user_1", name: "Aさん",
            summon: { hp: math_a.hp, attack: math_a.attack, defense: math_a.defense, speed: math_a.speed } },
          { userId: "user_2", name: "Bさん",
            summon: { hp: math_b.hp, attack: math_b.attack, defense: math_b.defense, speed: math_b.speed } }
        ]
      }, status: :ok
    end

    def finish
      render json: {
        battleId: params[:battle_id],
        status: "finished"
      }, status: :ok
    end
  end
end
