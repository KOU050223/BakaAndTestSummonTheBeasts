module Classroom
  # 学年単位のスコア集計（グラフ正規化用の最高点）。
  class GradeScoreSummary
    Summary = Struct.new(:max_total_score, :max_score_by_subject, keyword_init: true)

    # @param school_classes [Array<SchoolClass>] students / scores / exam を preload 済み想定
    # @return [Summary]
    def self.call(school_classes)
      students = school_classes.flat_map(&:students)
      return Summary.new(max_total_score: 0, max_score_by_subject: {}) if students.empty?

      max_total = students.map { |s| s.scores.sum(&:score) }.max || 0

      subject_max = Hash.new(0)
      students.each do |student|
        student.scores.group_by { |sc| sc.exam.subject }.each do |subject, scores|
          total = scores.sum(&:score)
          subject_max[subject] = total if total > subject_max[subject]
        end
      end

      Summary.new(
        max_total_score: max_total,
        max_score_by_subject: subject_max
      )
    end
  end
end
