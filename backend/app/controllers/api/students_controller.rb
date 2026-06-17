module Api
  # 召喚獣ステータス取得のスタブ。apiSpec.md §3.6 準拠。
  # 計算式は実装済みの Summon::StatusCalculator を使い、固定スコアから算出した
  # リアルな値を返す（フロントに実際のステータス形を見せる）。
  # TODO: 指定生徒の SummonStatus 実データ取得に差し替える。
  class StudentsController < BaseController
    before_action :authorize_summon_access!, only: :summon
    before_action -> { require_role!(:teacher, :school_admin) }, only: :update_class

    # 科目別の固定スコア（モック用）。本実装では生徒の最新点数から算出する。
    MOCK_SCORES = { "math" => 82, "english" => 61 }.freeze

    def summon
      subjects = MOCK_SCORES.transform_values { |s| Summon::StatusCalculator.call(s) }

      render json: {
        studentId: params[:id],
        summons: subjects.transform_values { |s| { hp: s.hp, attack: s.attack, defense: s.defense, speed: s.speed } }
      }, status: :ok
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
