require "rails_helper"

RSpec.describe Classroom::GradeScoreSummary do
  let(:class_a) { create(:school_class, grade: 2, name: "Aクラス") }
  let(:class_b) { create(:school_class, grade: 2, name: "Bクラス") }
  let(:student_a) { create(:user, :student) }
  let(:student_b) { create(:user, :student) }

  before do
    create(:class_membership, user: student_a, school_class: class_a)
    create(:class_membership, user: student_b, school_class: class_b)

    math_a = create(:exam, school_class: class_a, subject: "math")
    english_a = create(:exam, school_class: class_a, subject: "english")
    create(:score, exam: math_a, student: student_a, score: 90)
    create(:score, exam: english_a, student: student_a, score: 85)

    math_b = create(:exam, school_class: class_b, subject: "math")
    create(:score, exam: math_b, student: student_b, score: 70)
  end

  it "学年の全教科合計最高点と教科別最高点を返す" do
    classes = SchoolClass.where(grade: 2).includes(students: { scores: :exam }).order(:name)
    summary = described_class.call(classes.to_a)

    expect(summary.max_total_score).to eq(175)
    expect(summary.max_score_by_subject["math"]).to eq(90)
    expect(summary.max_score_by_subject["english"]).to eq(85)
  end
end
