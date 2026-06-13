module Api
  module Classes
    # クラス内生徒一覧のスタブ。点数入力画面（教師）が叩く。
    # TODO: 指定クラスの所属生徒の実データ取得に差し替える。
    class StudentsController < BaseController
      def index
        render json: {
          classId: params[:class_id],
          students: [
            { id: "student_f1", name: "吉井明久" },
            { id: "student_f2", name: "土屋康太" }
          ]
        }, status: :ok
      end
    end
  end
end
