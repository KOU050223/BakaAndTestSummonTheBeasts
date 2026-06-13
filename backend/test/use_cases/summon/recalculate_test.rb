require "test_helper"

class Summon::RecalculateTest < ActiveSupport::TestCase
  setup do
    @student = users(:student_one)
    @math_exam = exams(:math_exam)           # 100点満点
    @math_exam_200 = exams(:math_exam_200)   # 200点満点
  end

  test "100点満点の点数からステータスを計算して保存する" do
    Score.create!(exam: @math_exam, student: @student, score: 82)

    status = Summon::Recalculate.call(student: @student, subject: "math")

    expected = Summon::StatusCalculator.call(82)
    assert_equal expected.hp, status.hp
    assert_equal expected.attack, status.attack
    assert_equal expected.defense, status.defense
    assert_equal expected.speed, status.speed
  end

  test "満点を100点換算してから計算する" do
    # 200点満点で164点 => 82点換算
    Score.create!(exam: @math_exam_200, student: @student, score: 164)

    status = Summon::Recalculate.call(student: @student, subject: "math")

    assert_equal Summon::StatusCalculator.call(82).hp, status.hp
  end

  test "同一科目で直近に登録された点数を採用する" do
    Score.create!(exam: @math_exam, student: @student, score: 40)
    Score.create!(exam: @math_exam_200, student: @student, score: 200) # 100点換算、より新しい

    status = Summon::Recalculate.call(student: @student, subject: "math")

    assert_equal Summon::StatusCalculator.call(100).hp, status.hp
  end

  test "点数が無ければ0点扱いの仮ステータスになる" do
    status = Summon::Recalculate.call(student: @student, subject: "physics")

    assert_equal Summon::StatusCalculator.default.hp, status.hp
    assert_equal 0, status.attack
  end

  test "Score保存時のafter_saveでもステータスが追従する" do
    Score.create!(exam: @math_exam, student: @student, score: 100)

    status = SummonStatus.find_by(student: @student, subject: "math")
    assert_equal Summon::StatusCalculator.call(100).hp, status.hp
  end
end
