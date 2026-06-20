module Api
  module Classes
    # クラス内生徒一覧。クラス管理画面が総合スコア・最高科目の表示に使う。
    # 総合スコア・最高科目は Classroom::StudentScoreSummary に集計を委譲する。
    class StudentsController < BaseController
      before_action -> { require_role!(:teacher, :school_admin) }, only: :index
      before_action :set_school_class, only: :index

      def index
        memberships = @school_class.class_memberships.includes(user: { scores: :exam }).order(:id)
        leader_user_ids = @school_class.class_memberships.where(leader: true).pluck(:user_id).to_set

        rendered = memberships.map do |membership|
          student = membership.user
          summary = Classroom::StudentScoreSummary.call(student.scores)
          {
            id: student.id,
            name: student.name,
            grade: @school_class.grade,
            leader: leader_user_ids.include?(student.id),
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
