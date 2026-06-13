module Api
  module Exams
    # 試験別スコア取得のスタブ。点数入力画面（教師）が既存点数の表示に使う。
    # TODO: 指定試験のScore実データ取得に差し替える。
    class ScoresController < BaseController
      def index
        render json: {
          examId: params[:exam_id],
          scores: [
            { studentId: "student_f1", name: "吉井明久", score: 42 },
            { studentId: "student_f2", name: "土屋康太", score: 55 }
          ]
        }, status: :ok
      end
    end
  end
end
