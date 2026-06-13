module Api
  # 点数一括登録のスタブ。apiSpec.md §3.5 準拠。
  # 本実装では Exam::RegisterScores UseCase で点数永続化 + 召喚獣ステータス再計算を
  # トランザクションで一括処理する（docs/backend-design.md §6.3）。
  # TODO: 実保存・再計算に差し替える。
  class ScoresController < BaseController
    def create
      scores = params[:scores] || []
      render json: {
        examId: params[:examId] || "exam_1",
        registeredCount: scores.size
      }, status: :created
    end
  end
end
