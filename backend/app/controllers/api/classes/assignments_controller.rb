module Api
  module Classes
    # クラス振り分けの一括反映。自動振り分けの結果（生徒→クラスの割り当て）を
    # まとめて保存する。整合性のため全件をトランザクションで upsert し、
    # 1件でも不正（生徒・クラスが存在しない）なら全体をロールバックする。
    class AssignmentsController < BaseController
      before_action -> { require_role!(:teacher, :school_admin) }, only: :update

      def update
        assignments = params[:assignments]
        return render_invalid if assignments.blank? || !assignments.is_a?(Array)
        # 各要素が studentId / classId を持つことを保証する（不正要素での 500 を防ぐ）。
        return render_invalid unless assignments.all? { |a| valid_assignment?(a) }

        updated = 0
        ActiveRecord::Base.transaction do
          assignments.each do |a|
            student = User.find_by(id: a[:studentId], role: "student")
            school_class = SchoolClass.find_by(id: a[:classId])
            raise ActiveRecord::Rollback if student.nil? || school_class.nil?

            membership = ClassMembership.find_or_initialize_by(user: student)
            membership.school_class = school_class
            membership.save!
            updated += 1
          end
        end

        # ロールバック時は updated が件数に届かない。割り当て対象が見つからなかった扱い。
        return render_not_found if updated != assignments.size

        render json: { updatedCount: updated }, status: :ok
      end

      private

      # 要素が Hash 形式（JSON オブジェクト）で studentId / classId を持つか検証する。
      # 文字列・配列など [] で例外になる型を弾き、ループ内の 500 を防ぐ。
      def valid_assignment?(assignment)
        (assignment.is_a?(ActionController::Parameters) || assignment.is_a?(Hash)) &&
          assignment[:studentId].present? &&
          assignment[:classId].present?
      end

      def render_invalid
        render_error(code: "invalid_request", message: "assignments を配列で指定してください", status: :unprocessable_entity)
      end

      def render_not_found
        render_error(code: "not_found", message: "生徒またはクラスが見つかりません", status: :not_found)
      end
    end
  end
end
