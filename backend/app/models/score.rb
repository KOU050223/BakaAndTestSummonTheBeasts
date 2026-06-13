class Score < ApplicationRecord
  belongs_to :exam
  belongs_to :student, class_name: "User"

  validates :score, numericality: { greater_than_or_equal_to: 0 }
  validates :student_id, uniqueness: { scope: :exam_id }

  after_save :recalculate_summon_status

  private

  # 点数保存後、該当科目の召喚獣ステータスを再計算する。
  # 計算式の一元化のため Summon::Recalculate（→ Summon::StatusCalculator）へ委譲する。
  def recalculate_summon_status
    Summon::Recalculate.call(student: student, subject: exam.subject)
  end
end
