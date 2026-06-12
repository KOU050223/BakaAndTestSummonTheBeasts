class Score < ApplicationRecord
  belongs_to :exam
  belongs_to :student, class_name: "User"

  validates :score, numericality: { greater_than_or_equal_to: 0 }
  validates :student_id, uniqueness: { scope: :exam_id }

  after_save :recalculate_summon_status

  private

  def recalculate_summon_status
    normalized = (score.to_f / exam.max_score * 100).round
    SummonStatus.find_or_initialize_by(student: student, subject: exam.subject).tap do |ss|
      ss.hp      = normalized * 2
      ss.attack  = [ normalized / 2, 1 ].max
      ss.defense = [ normalized / 4, 1 ].max
      ss.speed   = [ normalized / 5, 1 ].max
      ss.save!
    end
  end
end
