require "test_helper"

class Summon::StatusCalculatorTest < ActiveSupport::TestCase
  test "満点100でステータスを計算する" do
    stats = Summon::StatusCalculator.call(100)

    assert_equal 150, stats.hp
    assert_equal 40, stats.attack
    assert_equal 15, stats.defense
    assert_equal 10, stats.speed
  end

  test "0点でも下限HP100を保証し他は0になる" do
    stats = Summon::StatusCalculator.call(0)

    assert_equal 100, stats.hp
    assert_equal 0, stats.attack
    assert_equal 0, stats.defense
    assert_equal 0, stats.speed
  end

  test "中間点(82)を四捨五入で計算する" do
    stats = Summon::StatusCalculator.call(82)

    assert_equal 141, stats.hp     # 100 + round(82*0.5)=41
    assert_equal 33, stats.attack  # round(82*0.4)=33
    assert_equal 12, stats.defense # round(82*0.15)=12.3→12
    assert_equal 8, stats.speed    # round(82*0.1)=8.2→8
  end

  test "範囲外の点数は0〜100にクランプする" do
    assert_equal Summon::StatusCalculator.call(0).hp,
                 Summon::StatusCalculator.call(-10).hp
    assert_equal Summon::StatusCalculator.call(100).attack,
                 Summon::StatusCalculator.call(150).attack
  end

  test "defaultは0点扱いの仮ステータスを返す" do
    assert_equal Summon::StatusCalculator.call(0).to_h,
                 Summon::StatusCalculator.default.to_h
  end
end
