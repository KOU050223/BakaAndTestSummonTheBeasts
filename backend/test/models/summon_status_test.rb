require "test_helper"

class SummonStatusTest < ActiveSupport::TestCase
  setup do
    @student = users(:student_one)
  end

  test "有効なSummonStatusを作成できる" do
    ss = SummonStatus.new(student: @student, subject: "math", hp: 100, attack: 50, defense: 25, speed: 20)
    assert ss.valid?
  end

  test "同じ生徒・同じ教科の重複登録は無効" do
    SummonStatus.create!(student: @student, subject: "math", hp: 100, attack: 50, defense: 25, speed: 20)
    dup = SummonStatus.new(student: @student, subject: "math", hp: 80, attack: 40, defense: 20, speed: 16)
    assert_not dup.valid?
  end

  test "同じ生徒でも異なる教科なら有効" do
    SummonStatus.create!(student: @student, subject: "math",    hp: 100, attack: 50, defense: 25, speed: 20)
    ss = SummonStatus.new(student: @student, subject: "english", hp: 80,  attack: 40, defense: 20, speed: 16)
    assert ss.valid?
  end

  test "hp / attack / defense / speed が0は有効" do
    ss = SummonStatus.new(student: @student, subject: "math", hp: 0, attack: 0, defense: 0, speed: 0)
    assert ss.valid?
  end

  test "hp が負の値は無効" do
    ss = SummonStatus.new(student: @student, subject: "math", hp: -1, attack: 1, defense: 1, speed: 1)
    assert_not ss.valid?
  end

  test "subjectが空では無効" do
    ss = SummonStatus.new(student: @student, subject: "", hp: 100, attack: 50, defense: 25, speed: 20)
    assert_not ss.valid?
  end
end
