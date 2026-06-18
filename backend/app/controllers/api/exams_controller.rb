module Api
  class ExamsController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }, only: %i[create upload_answer_key]
    before_action :set_exam, only: :upload_answer_key

    def index
      exams = case current_user.role
      when "student"
        current_user.school_class&.exams&.order(created_at: :desc) || []
      else
        Exam.where(created_by: current_user).order(created_at: :desc)
      end

      render json: {
        exams: exams.map { |e|
          e.as_json(only: %i[id title subject max_score]).merge(
            answer_key_status: answer_key_status(e)
          )
        }
      }
    end

    def upload_answer_key
      @exam.answer_key.attach(params.require(:answer_key_file))
      @exam.update!(answer_key_text: nil)
      OcrAnswerKeyJob.perform_later(@exam.id)
      render json: { status: "processing" }, status: :accepted
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

    private

    def set_exam
      @exam = Exam.find_by!(id: params[:id], created_by: current_user)
    end

    def answer_key_status(exam)
      return "none" unless exam.answer_key.attached?
      exam.answer_key_text.present? ? "done" : "processing"
    end
  end
end
