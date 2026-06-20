module Subject
  # 科目マスタの単一出典。試験・対戦・召喚獣など科目を扱う全機能がここを参照する。
  #
  # 現状は全国共通の固定科目をハードコードしているが、将来「学校ごとに科目を増減できる」
  # マスタ（subjects テーブル）へ移行する想定がある（docs 上の方針）。その際もこの ALL の
  # 中身を DB 読み込みに差し替えるだけで済むよう、参照側（Exam・Battle 等）は CODES /
  # LABELS / label のインターフェース越しにのみ科目を扱う。
  #
  # ActiveRecord・HTTP に依存しない PORO とし、コードと日本語ラベルの対応を一元化する。
  ALL = [
    { code: "english", label: "英語" },
    { code: "math", label: "数学" },
    { code: "physics", label: "物理" },
    { code: "chemistry", label: "化学" },
    { code: "biology", label: "生物" },
    { code: "earth_science", label: "地学" },
    { code: "geography", label: "地理" },
    { code: "japanese_history", label: "日本史" },
    { code: "world_history", label: "世界史" },
    { code: "civics", label: "公民" },
    { code: "japanese", label: "国語" },
    { code: "informatics", label: "情報" }
  ].freeze

  # 科目コードの配列（許可リスト）。Exam::SUBJECTS の実体。
  CODES = ALL.map { |s| s[:code] }.freeze

  # 科目コード → 日本語ラベルの対応表。
  LABELS = ALL.to_h { |s| [ s[:code], s[:label] ] }.freeze

  # 科目コードに対応する日本語ラベルを返す。未知のコードはコードそのものを返す
  # （未登録科目でも画面が壊れないようにするためのフォールバック）。
  def self.label(code)
    LABELS.fetch(code, code)
  end
end
