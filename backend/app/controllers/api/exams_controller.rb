module Api
  # 試験一覧・作成のスタブ。apiSpec.md §3.3, §3.4 準拠の固定モックを返す。
  # TODO: Exam の実データ取得・Exam::Create UseCase に差し替える。
  class ExamsController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }

    def index
      render json: {
        exams: [
          { id: "exam_1", title: "数学 小テスト1", subjectId: "math", createdBy: "teacher_1" },
          { id: "exam_2", title: "英語 小テスト1", subjectId: "english", createdBy: "teacher_1" }
        ]
      }, status: :ok
    end

    def create
      render json: {
        id: "exam_1",
        title: params[:title] || "数学 小テスト1",
        subjectId: params[:subjectId] || "math",
        classId: params[:classId] || "class_a",
        maxScore: params[:maxScore] || 100
      }, status: :created
    end
  end
end
