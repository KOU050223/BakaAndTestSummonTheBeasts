require "rails_helper"

RSpec.describe Classroom::ClassScoreSummary do
  let(:school_class) { create(:school_class, grade: 2, name: "Aクラス") }
  let(:student_a) { create(:user, :student, name: "生徒A") }
  let(:student_b) { create(:user, :student, name: "生徒B") }

  before do
    create(:class_membership, user: student_a, school_class: school_class)
    create(:class_membership, user: student_b, school_class: school_class)
  end

  describe ".total_average" do
    it "クラス生徒の全教科合計点の平均を返す" do
      math = create(:exam, school_class: school_class, subject: "math")
      english = create(:exam, school_class: school_class, subject: "english")
      create(:score, exam: math, student: student_a, score: 80)
      create(:score, exam: english, student: student_a, score: 70)
      create(:score, exam: math, student: student_b, score: 60)
      create(:score, exam: english, student: student_b, score: 50)

      school_class.reload
      loaded = SchoolClass.includes(students: { scores: :exam }).find(school_class.id)

      expect(described_class.total_average(loaded)).to eq(130)
    end
  end

  describe ".subject_averages" do
    it "教科ごとのクラス平均を返す" do
      math = create(:exam, school_class: school_class, subject: "math")
      english = create(:exam, school_class: school_class, subject: "english")
      create(:score, exam: math, student: student_a, score: 80)
      create(:score, exam: english, student: student_a, score: 70)
      create(:score, exam: math, student: student_b, score: 60)
      create(:score, exam: english, student: student_b, score: 50)

      school_class.reload
      loaded = SchoolClass.includes(students: { scores: :exam }).find(school_class.id)

      averages = described_class.subject_averages(loaded)
      math_avg = averages.find { |a| a.subject == "math" }
      english_avg = averages.find { |a| a.subject == "english" }

      expect(math_avg.average_score).to eq(70)
      expect(math_avg.subject_label).to eq("数学")
      expect(english_avg.average_score).to eq(60)
    end
  end
end
