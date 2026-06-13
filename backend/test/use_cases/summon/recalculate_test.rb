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

  test "同一科目で直近に実施された試験の点数を採用する（exams.created_atで判定）" do
    # math_exam_200 を「より新しい試験」に設定
    @math_exam.update_column(:created_at, 1.day.ago)
    @math_exam_200.update_column(:created_at, Time.current)

    Score.create!(exam: @math_exam,     student: @student, score: 40)
    Score.create!(exam: @math_exam_200, student: @student, score: 200) # 100点換算

    status = Summon::Recalculate.call(student: @student, subject: "math")

    assert_equal Summon::StatusCalculator.call(100).hp, status.hp
  end

  test "過去試験の点数を後追い入力しても新しい試験の点数を維持する" do
    # math_exam_200 が新しい試験、math_exam が古い試験
    @math_exam.update_column(:created_at, 1.day.ago)
    @math_exam_200.update_column(:created_at, Time.current)

    # 先に新しい試験の点数を入れてからを古い試験の点数を後追い入力
    Score.create!(exam: @math_exam_200, student: @student, score: 200) # 100点換算
    Score.create!(exam: @math_exam,     student: @student, score: 40)

    status = Summon::Recalculate.call(student: @student, subject: "math")

    # 古い試験の点数が後から入力されても新しい試験(math_exam_200)の点数が採用される
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
