module Api
  # クラス一覧。クラス管理画面が学年フィルタ・平均スコア・在籍人数の表示に使う。
  # 平均スコアは「クラス所属生徒の総合スコア（全科目点数合計）の平均」とする。
  class ClassesController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }, only: :index

    def index
      classes = SchoolClass.order(:grade, :name)
      classes = classes.where(grade: params[:grade]) if params[:grade].present?

      # 在籍人数と総合スコア合計を eager load し、クラスごとに集計する。
      # 平均スコアは点数合計のみで算出するため exam までは preload しない。
      classes = classes.includes(students: :scores)

      render json: { classes: classes.map { |c| serialize(c) } }, status: :ok
    end

    private

    def serialize(school_class)
      students = school_class.students
      total_scores = students.map { |s| s.scores.sum(&:score) }
      average = total_scores.empty? ? 0 : (total_scores.sum.to_f / total_scores.size).round

      {
        id: school_class.id,
        name: school_class.name,
        grade: school_class.grade,
        averageScore: average,
        studentCount: students.size
      }
    end
  end
end
