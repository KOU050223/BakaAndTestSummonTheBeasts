module Api
  # クラス一覧。クラス管理画面が学年フィルタ・平均スコア・在籍人数の表示に使う。
  # 平均スコアは「クラス所属生徒の総合スコア（全科目点数合計）の平均」とする。
  class ClassesController < BaseController
    before_action -> { require_role!(:teacher, :school_admin) }, only: %i[index create]

    def index
      classes = SchoolClass.order(:grade, :name)
      classes = classes.where(grade: params[:grade]) if params[:grade].present?

      classes = classes.includes(students: { scores: :exam })
      class_list = classes.to_a
      grade_summary = params[:grade].present? ? Classroom::GradeScoreSummary.call(class_list) : nil

      payload = { classes: class_list.map { |c| serialize(c) } }
      if grade_summary
        payload[:gradeMaxTotalScore] = grade_summary.max_total_score
        payload[:gradeMaxScoreBySubject] = grade_summary.max_score_by_subject
      end

      render json: payload, status: :ok
    end

    def create
      school_class = SchoolClass.new(
        name: params.require(:name),
        grade: params.require(:grade).to_i
      )

      if school_class.save
        render json: {
          id: school_class.id,
          name: school_class.name,
          grade: school_class.grade,
          averageScore: 0,
          studentCount: 0,
          subjectAverages: []
        }, status: :created
      else
        render_error(
          code: "validation_error",
          message: "入力内容を確認してください",
          status: :unprocessable_entity,
          details: school_class.errors.to_hash
        )
      end
    end

    private

    def serialize(school_class)
      {
        id: school_class.id,
        name: school_class.name,
        grade: school_class.grade,
        averageScore: Classroom::ClassScoreSummary.total_average(school_class),
        studentCount: school_class.students.size,
        subjectAverages: Classroom::ClassScoreSummary.subject_averages(school_class).map { |sa|
          {
            subject: sa.subject,
            subjectLabel: sa.subject_label,
            averageScore: sa.average_score
          }
        }
      }
    end
  end
end
