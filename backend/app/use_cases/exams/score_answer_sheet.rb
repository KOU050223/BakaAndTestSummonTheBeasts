class Exams::ScoreAnswerSheet
  def initialize(answer_sheet:, total_score:)
    @answer_sheet = answer_sheet
    @total_score = total_score
  end

  def call
    ActiveRecord::Base.transaction do
      score = Score.find_or_initialize_by(
        exam: @answer_sheet.exam,
        student: @answer_sheet.student
      )
      score.update!(score: @total_score)
      @answer_sheet.scored!
      score
    end
  end
end
