require 'rails_helper'

RSpec.describe Summon::Recalculate do
  let(:student)       { create(:user) }
  let(:math_exam)     { create(:exam) }           # 100点満点
  let(:math_exam_200) { create(:exam, :max_200) } # 200点満点

  it '100点満点の点数からステータスを計算して保存する' do
    create(:score, exam: math_exam, student: student, score: 82)
    status = Summon::Recalculate.call(student: student, subject: 'math')

    expected = Summon::StatusCalculator.call(82)
    expect(status.hp).to eq(expected.hp)
    expect(status.attack).to eq(expected.attack)
    expect(status.defense).to eq(expected.defense)
    expect(status.speed).to eq(expected.speed)
  end

  it '満点を100点換算してから計算する' do
    # 200点満点で164点 => 82点換算
    create(:score, exam: math_exam_200, student: student, score: 164)
    status = Summon::Recalculate.call(student: student, subject: 'math')

    expect(status.hp).to eq(Summon::StatusCalculator.call(82).hp)
  end

  it '同一科目で直近に実施された試験の点数を採用する（exams.created_atで判定）' do
    math_exam.update_column(:created_at, 1.day.ago)
    math_exam_200.update_column(:created_at, Time.current)

    create(:score, exam: math_exam,      student: student, score: 40)
    create(:score, exam: math_exam_200,  student: student, score: 200) # 100点換算

    status = Summon::Recalculate.call(student: student, subject: 'math')

    expect(status.hp).to eq(Summon::StatusCalculator.call(100).hp)
  end

  it '過去試験の点数を後追い入力しても新しい試験の点数を維持する' do
    math_exam.update_column(:created_at, 1.day.ago)
    math_exam_200.update_column(:created_at, Time.current)

    create(:score, exam: math_exam_200, student: student, score: 200) # 100点換算
    create(:score, exam: math_exam,     student: student, score: 40)

    status = Summon::Recalculate.call(student: student, subject: 'math')

    expect(status.hp).to eq(Summon::StatusCalculator.call(100).hp)
  end

  it '点数が無ければ0点扱いの仮ステータスになる' do
    status = Summon::Recalculate.call(student: student, subject: 'physics')

    expect(status.hp).to eq(Summon::StatusCalculator.default.hp)
    expect(status.attack).to eq(0)
  end

  it 'Score保存時のafter_saveでもステータスが追従する' do
    create(:score, exam: math_exam, student: student, score: 100)
    status = SummonStatus.find_by(student: student, subject: 'math')

    expect(status.hp).to eq(Summon::StatusCalculator.call(100).hp)
  end
end
