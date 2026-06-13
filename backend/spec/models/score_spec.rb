require 'rails_helper'

RSpec.describe Score, type: :model do
  let(:student) { users(:student_one) }
  let(:exam)    { exams(:math_exam) }

  describe 'バリデーション' do
    it '0点は有効' do
      score = Score.new(score: 0, exam: exam, student: student)
      expect(score).to be_valid
    end

    it '負の点数は無効' do
      score = Score.new(score: -1, exam: exam, student: student)
      expect(score).not_to be_valid
      expect(score.errors.details[:score]).to include({ error: :greater_than_or_equal_to, value: -1, count: 0 })
    end

    it '同じ生徒が同じ試験に2回登録できない' do
      Score.create!(score: 80, exam: exam, student: student)
      duplicate = Score.new(score: 90, exam: exam, student: student)
      expect(duplicate).not_to be_valid
    end

    it '同じ生徒でも別の試験なら登録できる' do
      Score.create!(score: 80, exam: exam, student: student)
      other_exam = exams(:english_exam)
      score = Score.new(score: 70, exam: other_exam, student: student)
      expect(score).to be_valid
    end
  end

  describe 'recalculate_summon_status: ステータス計算式' do
    it '100点満点で満点を取るとステータスが最大値になる' do
      Score.create!(score: 100, exam: exam, student: student)
      ss = SummonStatus.find_by(student: student, subject: 'math')

      expect(ss.hp).to eq(150)
      expect(ss.attack).to eq(40)
      expect(ss.defense).to eq(15)
      expect(ss.speed).to eq(10)
    end

    it '0点のときHPは下限100で他は0になる' do
      Score.create!(score: 0, exam: exam, student: student)
      ss = SummonStatus.find_by(student: student, subject: 'math')

      expect(ss.hp).to eq(100)
      expect(ss.attack).to eq(0)
      expect(ss.defense).to eq(0)
      expect(ss.speed).to eq(0)
    end

    it '50点（50%）のときステータスが正しく計算される' do
      Score.create!(score: 50, exam: exam, student: student)
      ss = SummonStatus.find_by(student: student, subject: 'math')

      expect(ss.hp).to eq(125)
      expect(ss.attack).to eq(20)
      expect(ss.defense).to eq(8)
      expect(ss.speed).to eq(5)
    end

    it '200点満点で100点を取ると50%換算になる' do
      exam_200 = exams(:math_exam_200)
      Score.create!(score: 100, exam: exam_200, student: student)
      ss = SummonStatus.find_by(student: student, subject: 'math')

      expect(ss.hp).to eq(125)
      expect(ss.attack).to eq(20)
      expect(ss.defense).to eq(8)
      expect(ss.speed).to eq(5)
    end
  end

  describe 'recalculate_summon_status: upsert挙動' do
    it '点数を保存するとSummonStatusが新規作成される' do
      expect { Score.create!(score: 80, exam: exam, student: student) }
        .to change(SummonStatus, :count).by(1)
    end

    it '点数を更新するとSummonStatusが上書きされ件数は増えない' do
      score = Score.create!(score: 80, exam: exam, student: student)

      expect { score.update!(score: 60) }.not_to change(SummonStatus, :count)

      ss = SummonStatus.find_by(student: student, subject: 'math')
      expect(ss.hp).to eq(130) # score 60 => 100 + round(60*0.5)
    end

    it '異なる教科のスコアはそれぞれ独立したSummonStatusを持つ' do
      english_exam = exams(:english_exam)
      Score.create!(score: 80, exam: exam,         student: student)
      Score.create!(score: 60, exam: english_exam, student: student)

      math_ss    = SummonStatus.find_by(student: student, subject: 'math')
      english_ss = SummonStatus.find_by(student: student, subject: 'english')

      expect(math_ss.hp).to eq(140)    # score 80 => 100 + round(80*0.5)
      expect(english_ss.hp).to eq(130) # score 60 => 100 + round(60*0.5)
    end
  end
end
