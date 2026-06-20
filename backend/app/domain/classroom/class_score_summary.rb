module Classroom
  # クラス1件分のスコア集計（全教科合計平均・教科別平均）。
  class ClassScoreSummary
    SubjectAverage = Struct.new(:subject, :subject_label, :average_score, keyword_init: true)

    # @param school_class [SchoolClass] students と scores（exam 込み）を preload 済み想定
    # @return [Array<Classroom::ClassScoreSummary::SubjectAverage>]
    def self.subject_averages(school_class)
      students = school_class.students
      return [] if students.empty?

      subjects = students.flat_map { |s| s.scores.map { |sc| sc.exam.subject } }.uniq.sort

      subjects.map do |subject|
        per_student = students.map do |student|
          student.scores.select { |sc| sc.exam.subject == subject }.sum(&:score)
        end
        average = (per_student.sum.to_f / students.size).round

        SubjectAverage.new(
          subject: subject,
          subject_label: Subject.label(subject),
          average_score: average
        )
      end
    end

    # @param school_class [SchoolClass]
    # @return [Integer] クラス所属生徒の全教科合計点の平均
    def self.total_average(school_class)
      students = school_class.students
      return 0 if students.empty?

      totals = students.map { |s| s.scores.sum(&:score) }
      (totals.sum.to_f / totals.size).round
    end
  end
end
