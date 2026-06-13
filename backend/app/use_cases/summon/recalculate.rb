module Summon
  # ある生徒・ある科目について、召喚獣ステータスを再計算して永続化する。
  #
  # 「召喚獣の力は該当科目で直近に受けたテストの点数に比例する」というドメインルール
  # （docs/domain/contexts/summon.md）に従い、対象科目の最新点数を採用する。
  # 計算式は Summon::StatusCalculator に一元化する（docs/backend-design.md §5.1）。
  class Recalculate
    # @param student [User] 対象の生徒
    # @param subject [String] 対象科目（Exam::SUBJECTS のいずれか）
    # @return [SummonStatus]
    def self.call(student:, subject:)
      normalized = latest_normalized_score(student:, subject:)
      stats = StatusCalculator.call(normalized)

      SummonStatus.find_or_initialize_by(student: student, subject: subject).tap do |ss|
        ss.hp      = stats.hp
        ss.attack  = stats.attack
        ss.defense = stats.defense
        ss.speed   = stats.speed
        ss.save!
      end
    end

    # 対象科目で直近に登録された点数を 100 点換算して返す。点数がなければ 0。
    def self.latest_normalized_score(student:, subject:)
      score = Score
        .joins(:exam)
        .where(student: student, exams: { subject: subject })
        .order(created_at: :desc)
        .first
      return 0 if score.nil?

      (score.score.to_f / score.exam.max_score * 100).round
    end
    private_class_method :latest_normalized_score
  end
end
