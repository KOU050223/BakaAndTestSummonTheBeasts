module Classroom
  # 生徒1人分のスコア集計（クラス管理画面の生徒一覧で使う）。
  # 総合スコアは全科目の点数合計、最高科目は科目別最高点の科目とする。
  # ActiveRecord に依存するが、集計ルールをコントローラから切り離すための PORO。
  class StudentScoreSummary
    Summary = Struct.new(:total_score, :top_subject_label, :top_subject_score, keyword_init: true)

    # @param scores [Array<Score>] 対象生徒の Score（exam を eager load 済み想定）
    # @return [Summary]
    def self.call(scores)
      total = scores.sum(&:score)
      top = scores.max_by(&:score)

      Summary.new(
        total_score: total,
        top_subject_label: top && Subject.label(top.exam.subject),
        top_subject_score: top&.score
      )
    end
  end
end
