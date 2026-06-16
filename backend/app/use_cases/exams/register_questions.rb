class Exams::RegisterQuestions
  def initialize(exam:, questions_params:)
    @exam = exam
    @questions_params = questions_params
  end

  def call
    ActiveRecord::Base.transaction do
      @exam.exam_questions.destroy_all
      @questions_params.each do |q|
        @exam.exam_questions.create!(
          number: q[:number],
          question_text: q[:question_text],
          model_answer: q[:model_answer],
          points: q[:points]
        )
      end
    end
    @exam.exam_questions
  end
end
