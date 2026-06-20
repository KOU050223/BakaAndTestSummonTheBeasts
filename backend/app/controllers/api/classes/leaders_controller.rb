module Api
  module Classes
    # クラスのリーダー設定。教師がクラス管理画面でリーダーを変更する。
    # クラスごとにリーダーは1人に保つ（partial unique index で DB レベルでも保証）。
    class LeadersController < BaseController
      before_action -> { require_role!(:teacher) }
      before_action :set_school_class

      # PATCH /api/classes/:class_id/leader
      # body: { studentId: integer } → 指定生徒をリーダーに設定（既存リーダーは解除）
      # body: { studentId: null }   → リーダーを解除（リーダーなしにする）
      def update
        student_id = params[:studentId]

        ActiveRecord::Base.transaction do
          # 既存リーダーを解除
          @school_class.class_memberships.where(leader: true).update_all(leader: false)

          if student_id.present?
            membership = @school_class.class_memberships.find_by!(user_id: student_id.to_i)
            membership.update!(leader: true)
          end
        end

        render json: { classId: @school_class.id, leaderId: student_id&.to_i }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render_error(code: "not_found", message: "指定された生徒はこのクラスに所属していません", status: :not_found)
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
