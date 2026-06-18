module Api
  # 召喚獣ステータス取得。apiSpec.md §3.6 準拠。
  # 指定生徒の SummonStatus 実データ（点数登録時に Summon::Recalculate で永続化済み）を
  # 科目別に返す。ステータス未生成の科目は含めない。
  # 各要素は科目コード（code）と表示用ラベル（label, Subject ドメインが出典）を持つ。
  class StudentsController < BaseController
    before_action :authorize_summon_access!, only: :summon
    before_action -> { require_role!(:teacher, :school_admin) }, only: :update_class

    def summon
      student = User.find_by(id: params[:id], role: "student")
      return render_error(code: "not_found", message: "生徒が見つかりません", status: :not_found) if student.nil?

      # 科目マスタ（Subject::CODES）の定義順に並べ、レスポンスの並びを安定させる。
      by_subject = student.summon_statuses.index_by(&:subject)
      summons = Subject::CODES.filter_map do |code|
        ss = by_subject[code]
        next if ss.nil?

        { code: ss.subject, label: Subject.label(ss.subject), hp: ss.hp, attack: ss.attack, defense: ss.defense, speed: ss.speed }
      end

      render json: { studentId: student.id.to_s, summons: summons }, status: :ok
    end

    # 生徒の所属クラスを変更する。ClassMembership は生徒1人につき1件のため upsert する。
    def update_class
      student = User.find_by(id: params[:id], role: "student")
      return render_error(code: "not_found", message: "生徒が見つかりません", status: :not_found) if student.nil?

      school_class = SchoolClass.find_by(id: params[:class_id])
      return render_error(code: "not_found", message: "クラスが見つかりません", status: :not_found) if school_class.nil?

      membership = ClassMembership.find_or_initialize_by(user: student)
      membership.school_class = school_class
      membership.save!

      render json: {
        studentId: student.id,
        schoolClass: { id: school_class.id, name: school_class.name, grade: school_class.grade }
      }, status: :ok
    end

    private

    def authorize_summon_access!
      return if %w[teacher school_admin].include?(current_user&.role)
      return if current_user&.id.to_s == params[:id].to_s

      render_error(code: "forbidden", message: "権限がありません", status: :forbidden) and return
    end
  end
end
