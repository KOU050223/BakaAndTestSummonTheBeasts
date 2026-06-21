// WebSpeech API（音声認識）の最小型定義。
// 標準の TypeScript dom lib には含まれないため、本機能で使う範囲だけを宣言する。
// 実装はブラウザ依存で、Chrome 系は webkitSpeechRecognition として提供される。

// 1 件の認識候補。transcript に文字起こし結果が入る。
export type SpeechRecognitionAlternative = {
  readonly transcript: string;
  readonly confidence: number;
};

// 1 発話ぶんの認識結果（複数候補を持つ配列ライク）。
export type SpeechRecognitionResult = {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
};

// onresult イベントが運ぶ結果リスト。
export type SpeechRecognitionResultList = {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
};

export type SpeechRecognitionEvent = {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
};

export type SpeechRecognitionErrorEvent = {
  readonly error: string;
  readonly message: string;
};

// 音声認識インスタンス。本機能で使うプロパティ／メソッドのみ宣言する。
export type SpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognition;

// ブラウザに実装された SpeechRecognition コンストラクタを取得する。
// 非対応環境（型上は存在しうるが実体が無い）では undefined を返す。
export function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
