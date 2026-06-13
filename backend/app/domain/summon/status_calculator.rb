module Summon
  # 点数（100点換算した 0〜100 のスコア）から召喚獣ステータスを計算する純粋関数。
  #
  # 計算式は「単純な一次式で開始」する方針（docs/backend-design.md §5.1）。
  # 係数は後続フェーズのバランス調整で差し替えられるよう COEFFICIENTS に集約する。
  # ActiveRecord・HTTP に依存しない PORO とし、単体でテストできるようにする。
  #
  # zeitwerk 規約に従い app/domain がオートロードルート、本ファイルは
  # Summon::StatusCalculator を定義する（集約モデル SummonStatus とは別名前空間）。
  class StatusCalculator
    HP_BASE = 100

    # スコア係数。s=100 のとき HP=150 / attack=40 / defense=15 / speed=10。
    COEFFICIENTS = {
      hp: 0.5,
      attack: 0.4,
      defense: 0.15,
      speed: 0.1
    }.freeze

    Stats = Struct.new(:hp, :attack, :defense, :speed, keyword_init: true)

    # @param score [Integer, Float] 100点換算後のスコア（0〜100）
    # @return [Stats]
    def self.call(score)
      s = normalize(score)
      Stats.new(
        hp: HP_BASE + (s * COEFFICIENTS[:hp]).round,
        attack: (s * COEFFICIENTS[:attack]).round,
        defense: (s * COEFFICIENTS[:defense]).round,
        speed: (s * COEFFICIENTS[:speed]).round
      )
    end

    # 点数未登録の生徒向けの 0 点扱い仮ステータス（docs/backend-design.md §5.2）。
    # @return [Stats]
    def self.default
      call(0)
    end

    def self.normalize(score)
      s = score.to_f
      s = 0.0 if s.negative?
      s = 100.0 if s > 100.0
      s
    end
    private_class_method :normalize
  end
end
