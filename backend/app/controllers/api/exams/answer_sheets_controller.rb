module Api
  module Exams
    class AnswerSheetsController < BaseController
      before_action -> { require_role!(:teacher, :school_admin) }
      before_action :set_exam

      def show
        sheet = @exam.answer_sheets.find(params[:id])
        render json: answer_sheet_json(sheet)
      end

      def create
        student = User.find(params[:student_id])
        sheet = Exams::UploadAnswerSheet.new(
          exam: @exam,
          student: student,
          image: params.require(:image)
        ).call
        render json: answer_sheet_json(sheet), status: :created
      end

      def score
        sheet = @exam.answer_sheets.find(params[:id])
        score = Exams::ScoreAnswerSheet.new(
          answer_sheet: sheet,
          total_score: params.require(:total_score).to_i
        ).call
        render json: { score: score.score }, status: :ok
      end

      private

      def set_exam
        @exam = ::Exam.find(params[:exam_id])
      end

      def answer_sheet_json(sheet)
        {
          id: sheet.id,
          status: sheet.status,
          ocr_text: sheet.ocr_text,
          student_id: sheet.student_id,
          image_url: sheet.image.attached? ? url_for(sheet.image) : nil,
          questions: @exam.exam_questions.as_json(only: %i[id number question_text model_answer points])
        }
      end
    end
  end
end
