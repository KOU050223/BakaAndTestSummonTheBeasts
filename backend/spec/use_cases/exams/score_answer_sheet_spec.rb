require "rails_helper"

RSpec.describe Exams::ScoreAnswerSheet do
  let(:exam) { create(:exam) }
  let(:student) { create(:user, role: "student") }
  let(:answer_sheet) { create(:answer_sheet, exam: exam, student: student, status: "ocr_done") }

  subject(:call) { described_class.new(answer_sheet: answer_sheet, total_score: 80).call }

  it "スコアを保存する" do
    expect { call }.to change { Score.count }.by(1)
    expect(Score.last.score).to eq(80)
  end

  it "answer_sheetのステータスをscoredにする" do
    call
    expect(answer_sheet.reload.status).to eq("scored")
  end

  it "同じ生徒・試験の再採点でスコアを上書きする" do
    call
    described_class.new(answer_sheet: answer_sheet, total_score: 90).call
    expect(Score.where(exam: exam, student: student).count).to eq(1)
    expect(Score.last.score).to eq(90)
  end
end
