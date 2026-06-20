// 科目コード → 日本語ラベル。WS state には科目コードしか来ないため、表示用にここで引く。
// 正本はバックエンド backend/app/domain/subject.rb の Subject::ALL。
// 未定義の科目はコードをそのまま返す（Subject.label と同じフォールバック）。
const SUBJECT_LABEL: Record<string, string> = {
  english: "英語",
  math: "数学",
  physics: "物理",
  chemistry: "化学",
  biology: "生物",
  earth_science: "地学",
  geography: "地理",
  japanese_history: "日本史",
  world_history: "世界史",
  civics: "公民",
  japanese: "国語",
};

export function subjectLabel(subjectCode: string): string {
  return SUBJECT_LABEL[subjectCode] ?? subjectCode;
}
