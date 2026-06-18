// 科目コード → 召喚獣の立ち絵パス。public/ 配下の画像を指す。
// 現状は共通の baka_kirei.png のみ。科目別の立ち絵が増えたらここに追加するだけで
// SummonScreen 側は変更不要（未定義の科目は DEFAULT_SUMMON_IMAGE にフォールバック）。
const DEFAULT_SUMMON_IMAGE = "/baka_kirei.png";

const SUBJECT_IMAGE: Record<string, string> = {
  // 例: math: "/summon/math.png",
};

export function summonImage(subjectCode: string): string {
  return SUBJECT_IMAGE[subjectCode] ?? DEFAULT_SUMMON_IMAGE;
}
