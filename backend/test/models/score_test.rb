require "test_helper"

class ScoreTest < ActiveSupport::TestCase
  setup do
    @student = users(:student_one)
    @exam    = exams(:math_exam)
  end

  # --- バリデーション ---

  test "0点は有効" do
    score = Score.new(score: 0, exam: @exam, student: @student)
    assert score.valid?
  end

  test "負の点数は無効" do
    score = Score.new(score: -1, exam: @exam, student: @student)
    assert_not score.valid?
    assert_includes score.errors[:score], "must be greater than or equal to 0"
  end

  test "同じ生徒が同じ試験に2回登録できない" do
    Score.create!(score: 80, exam: @exam, student: @student)
    duplicate = Score.new(score: 90, exam: @exam, student: @student)
    assert_not duplicate.valid?
  end

  test "同じ生徒でも別の試験なら登録できる" do
    Score.create!(score: 80, exam: @exam, student: @student)
    other_exam = exams(:english_exam)
    score = Score.new(score: 70, exam: other_exam, student: @student)
    assert score.valid?
  end

  # --- recalculate_summon_status: ステータス計算式 ---

  test "100点満点で満点を取るとステータスが最大値になる" do
    Score.create!(score: 100, exam: @exam, student: @student)
    ss = SummonStatus.find_by(student: @student, subject: "math")

    assert_equal 200, ss.hp
    assert_equal 50,  ss.attack
    assert_equal 25,  ss.defense
    assert_equal 20,  ss.speed
  end

  test "0点のときHPは0だがattack/defense/speedは最低値1になる" do
    Score.create!(score: 0, exam: @exam, student: @student)
    ss = SummonStatus.find_by(student: @student, subject: "math")

    assert_equal 0, ss.hp
    assert_equal 1, ss.attack
    assert_equal 1, ss.defense
    assert_equal 1, ss.speed
  end

  test "50点（50%）のときステータスが正しく計算される" do
    Score.create!(score: 50, exam: @exam, student: @student)
    ss = SummonStatus.find_by(student: @student, subject: "math")

    assert_equal 100, ss.hp
    assert_equal 25,  ss.attack
    assert_equal 12,  ss.defense
    assert_equal 10,  ss.speed
  end

  test "200点満点で100点を取ると50%換算になる" do
    exam_200 = exams(:math_exam_200)
    Score.create!(score: 100, exam: exam_200, student: @student)
    ss = SummonStatus.find_by(student: @student, subject: "math")

    assert_equal 100, ss.hp
    assert_equal 25,  ss.attack
    assert_equal 12,  ss.defense
    assert_equal 10,  ss.speed
  end

  # --- recalculate_summon_status: upsert挙動 ---

  test "点数を保存するとSummonStatusが新規作成される" do
    assert_difference "SummonStatus.count", 1 do
      Score.create!(score: 80, exam: @exam, student: @student)
    end
  end

  test "点数を更新するとSummonStatusが上書きされ件数は増えない" do
    score = Score.create!(score: 80, exam: @exam, student: @student)

    assert_no_difference "SummonStatus.count" do
      score.update!(score: 60)
    end

    ss = SummonStatus.find_by(student: @student, subject: "math")
    assert_equal 120, ss.hp
  end

  test "異なる教科のスコアはそれぞれ独立したSummonStatusを持つ" do
    english_exam = exams(:english_exam)
    Score.create!(score: 80, exam: @exam,         student: @student)
    Score.create!(score: 60, exam: english_exam,  student: @student)

    math_ss    = SummonStatus.find_by(student: @student, subject: "math")
    english_ss = SummonStatus.find_by(student: @student, subject: "english")

    assert_equal 160, math_ss.hp
    assert_equal 120, english_ss.hp
  end
end
