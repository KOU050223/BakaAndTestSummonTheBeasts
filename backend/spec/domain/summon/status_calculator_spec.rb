require 'rails_helper'

RSpec.describe Summon::StatusCalculator do
  describe '.call' do
    it '満点100でステータスを計算する' do
      stats = Summon::StatusCalculator.call(100)

      expect(stats.hp).to eq(150)
      expect(stats.attack).to eq(40)
      expect(stats.defense).to eq(15)
      expect(stats.speed).to eq(10)
    end

    it '0点でも下限HP100を保証し他は0になる' do
      stats = Summon::StatusCalculator.call(0)

      expect(stats.hp).to eq(100)
      expect(stats.attack).to eq(0)
      expect(stats.defense).to eq(0)
      expect(stats.speed).to eq(0)
    end

    it '中間点(82)を四捨五入で計算する' do
      stats = Summon::StatusCalculator.call(82)

      expect(stats.hp).to eq(141)     # 100 + round(82*0.5)=41
      expect(stats.attack).to eq(33)  # round(82*0.4)=33
      expect(stats.defense).to eq(12) # round(82*0.15)=12.3→12
      expect(stats.speed).to eq(8)    # round(82*0.1)=8.2→8
    end

    it '範囲外の点数は0〜100にクランプする' do
      expect(Summon::StatusCalculator.call(-10).hp).to eq(Summon::StatusCalculator.call(0).hp)
      expect(Summon::StatusCalculator.call(150).attack).to eq(Summon::StatusCalculator.call(100).attack)
    end
  end

  describe '.default' do
    it '0点扱いの仮ステータスを返す' do
      expect(Summon::StatusCalculator.default.to_h).to eq(Summon::StatusCalculator.call(0).to_h)
    end
  end
end
