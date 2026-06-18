module Api
  module Exams
    class QuestionsController < BaseController
      before_action -> { require_role!(:teacher, :school_admin) }
      before_action :set_exam

      def index
        render json: {
          questions: @exam.exam_questions.as_json(only: %i[id number question_text model_answer points]),
          answer_key_attached: @exam.answer_key.attached?
        }
      end

      def create
        questions = ::Exams::RegisterQuestions.new(
          exam: @exam,
          questions_params: questions_params
        ).call
        render json: { questions: questions.as_json(only: %i[id number question_text model_answer points]) }, status: :created
      end

      private

      def set_exam
        @exam = ::Exam.find(params[:exam_id])
      end

      def questions_params
        params.require(:questions).map do |q|
          q.permit(:number, :question_text, :model_answer, :points)
        end
      end
    end
  end
end
