module Api
  class ExamsController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }, only: :create

    def index
      exams = case current_user.role
      when "student"
        current_user.school_class&.exams&.order(created_at: :desc) || []
      else
        Exam.where(created_by: current_user).order(created_at: :desc)
      end

      render json: {
        exams: exams.as_json(only: %i[id title subject max_score])
      }
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
