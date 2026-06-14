module Api
  # クラス一覧のスタブ。apiSpec.md §3.2 準拠の固定モックを返す。
  # TODO: SchoolClass からの実データ取得に差し替える。
  class ClassesController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }, only: :index

    def index
      render json: {
        classes: [
          { id: "class_a", name: "Aクラス" },
          { id: "class_f", name: "Fクラス" }
        ]
      }, status: :ok
    end
  end
end
