module Api
  module Exams
    class AnswerSheetsController < BaseController
      before_action :set_exam

      # 教師：試験に提出された答案一覧
      def index
        require_role!(:teacher, :school_admin)
        sheets = @exam.answer_sheets.includes(:student).order(created_at: :desc)
        render json: {
          answer_sheets: sheets.map { |s|
            {
              id: s.id,
              status: s.status,
              student_id: s.student_id,
              student_name: s.student.name,
              updated_at: s.updated_at
            }
          }
        }
      end

      # 生徒・教師ともに参照可
      def show
        sheet = find_accessible_sheet
        render json: answer_sheet_json(sheet)
      end

      # 生徒：自分の答案をアップロード
      # 教師：任意の生徒の答案をアップロード（student_id 指定）
      def create
        student = if current_user.role == "student"
          current_user
        else
          require_role!(:teacher, :school_admin)
          User.find(params.require(:student_id))
        end

        sheet = Exams::UploadAnswerSheet.new(
          exam: @exam,
          student: student,
          image: params.require(:image)
        ).call
        render json: answer_sheet_json(sheet), status: :created
      end

      # 教師：採点結果を登録
      def score
        require_role!(:teacher, :school_admin)
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

      def find_accessible_sheet
        if current_user.role == "student"
          @exam.answer_sheets.find_by!(student: current_user)
        else
          @exam.answer_sheets.find(params[:id])
        end
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
