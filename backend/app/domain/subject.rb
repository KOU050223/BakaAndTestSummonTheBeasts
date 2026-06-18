module Subject
  # 科目の出典を一元化するドメインモジュール。
  # 科目コード（英語キー）と画面表示用の日本語ラベルの対応を唯一の正とし、
  # モデル・コントローラ・集計ロジックはすべてここを参照する。
  # ActiveRecord・HTTP に依存しない純粋なデータ定義。

  # 科目コード→日本語ラベルの対応。表示順もこの順序に従う。
  LABELS = {
    "english" => "英語",
    "math" => "数学",
    "physics" => "物理",
    "chemistry" => "化学",
    "biology" => "生物",
    "earth_science" => "地学",
    "geography" => "地理",
    "japanese_history" => "日本史",
    "world_history" => "世界史",
    "civics" => "公民",
    "japanese" => "国語"
  }.freeze

  # 有効な科目コードの一覧。
  CODES = LABELS.keys.freeze

  # 科目コードに対応する日本語ラベルを返す。
  # 未知のコードはコードそのものを返す（フォールバック）。
  # @param code [String, Symbol]
  # @return [String]
  def self.label(code)
    LABELS.fetch(code.to_s, code.to_s)
  end
end
