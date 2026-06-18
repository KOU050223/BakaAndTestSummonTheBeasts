require "rails_helper"

RSpec.describe Exams::RegisterQuestions do
  let(:exam) { create(:exam) }

  let(:questions_params) do
    [
      { number: 1, question_text: "日本の首都は？", model_answer: "東京", points: 10 },
      { number: 2, question_text: "1+1は？", model_answer: "2", points: 5 }
    ]
  end

  subject(:call) { described_class.new(exam: exam, questions_params: questions_params).call }

  it "問題を登録できる" do
    expect { call }.to change { exam.exam_questions.count }.from(0).to(2)
  end

  it "登録した問題の内容が正しい" do
    questions = call
    expect(questions.first).to have_attributes(number: 1, question_text: "日本の首都は？", points: 10)
  end

  it "再登録すると既存の問題を置き換える" do
    call
    new_params = [ { number: 1, question_text: "新しい問題", model_answer: "答え", points: 20 } ]
    described_class.new(exam: exam, questions_params: new_params).call
    expect(exam.exam_questions.count).to eq(1)
    expect(exam.exam_questions.first.question_text).to eq("新しい問題")
  end
end
