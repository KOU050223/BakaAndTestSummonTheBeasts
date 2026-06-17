module Api
  module Classes
    # クラス内生徒一覧。クラス管理画面が総合スコア・最高科目の表示に使う。
    # 総合スコア・最高科目は Classroom::StudentScoreSummary に集計を委譲する。
    class StudentsController < BaseController
      before_action -> { require_role!(:teacher, :school_admin) }, only: :index
      before_action :set_school_class, only: :index

      def index
        students = @school_class.students.includes(scores: :exam).order(:id)

        rendered = students.map do |student|
          summary = Classroom::StudentScoreSummary.call(student.scores)
          {
            id: student.id,
            name: student.name,
            grade: @school_class.grade,
            totalScore: summary.total_score,
            topSubject: {
              name: summary.top_subject_label || "未受験",
              score: summary.top_subject_score || 0
            }
          }
        end

        render json: { classId: @school_class.id, students: rendered }, status: :ok
      end

      private

      def set_school_class
        @school_class = SchoolClass.find(params[:class_id])
      rescue ActiveRecord::RecordNotFound
        render_error(code: "not_found", message: "クラスが見つかりません", status: :not_found)
      end
    end
  end
end
