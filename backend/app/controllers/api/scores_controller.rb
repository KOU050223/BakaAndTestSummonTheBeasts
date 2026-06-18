module Api
  class ScoresController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }, only: :create

    # 生徒：自分の全試験スコアを取得
    def index
      scores = Score.includes(:exam)
        .where(student: current_user)
        .order(created_at: :desc)

      render json: {
        scores: scores.map { |s|
          {
            exam_id: s.exam_id,
            exam_title: s.exam.title,
            subject: s.exam.subject,
            subject_label: Subject.label(s.exam.subject),
            score: s.score,
            max_score: s.exam.max_score,
            scored_at: s.updated_at
          }
        }
      }
    end

    def create
      scores = params[:scores] || []
      render json: {
        examId: params[:examId] || "exam_1",
        registeredCount: scores.size
      }, status: :created
    end
  end
end
