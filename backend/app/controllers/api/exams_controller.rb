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
      exam = Exam.new(
        title: params.require(:title),
        subject: params.require(:subject),
        school_class_id: params.require(:class_id),
        max_score: params.fetch(:max_score, 100).to_i,
        created_by: current_user
      )

      if exam.save
        render json: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          class_id: exam.school_class_id,
          max_score: exam.max_score
        }, status: :created
      else
        render_error(
          code: "validation_error",
          message: "入力内容を確認してください",
          status: :unprocessable_entity,
          details: exam.errors.to_hash
        )
      end
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
