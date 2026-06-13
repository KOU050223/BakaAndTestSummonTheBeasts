module Api
  # 召喚獣ステータス取得のスタブ。apiSpec.md §3.6 準拠。
  # 計算式は実装済みの Summon::StatusCalculator を使い、固定スコアから算出した
  # リアルな値を返す（フロントに実際のステータス形を見せる）。
  # TODO: 指定生徒の SummonStatus 実データ取得に差し替える。
  class StudentsController < BaseController
    # 科目別の固定スコア（モック用）。本実装では生徒の最新点数から算出する。
    MOCK_SCORES = { "math" => 82, "english" => 61 }.freeze

    def summon
      subjects = MOCK_SCORES.transform_values { |s| Summon::StatusCalculator.call(s) }

      render json: {
        studentId: params[:id],
        summons: subjects.transform_values { |s| { hp: s.hp, attack: s.attack, defense: s.defense, speed: s.speed } }
      }, status: :ok
    end
  end
end
