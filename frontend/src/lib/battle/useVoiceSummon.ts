"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSpeechRecognition,
  type SpeechRecognition,
  type SpeechRecognitionEvent,
} from "./speechRecognition";

type UseVoiceSummonOptions = {
  // 音声認識を動かすか。バトル中のみ true にする想定。
  enabled: boolean;
  // 発火トリガー語（例：["サモン", "召喚"]）。いずれかを含めば発火する。
  keywords: string[];
  // キーワード検知時に呼ぶコールバック（サモン入力をトリガーする）。
  onTrigger: () => void;
};

type UseVoiceSummonResult = {
  // このブラウザが WebSpeech API に対応しているか。
  supported: boolean;
  // 現在リスニング中か（UI のインジケータ用）。
  listening: boolean;
};

// 認識言語（日本語固定）。
const RECOGNITION_LANG = "ja-JP";

// バトル中に常時マイクを聞き、トリガー語を検知したら onTrigger を呼ぶフック。
// continuous モードで聞き続け、ブラウザが認識を終了したら（onend）自動で再開する。
// onTrigger は ref 経由で参照するため、コールバックの同一性に依存せず認識を中断しない。
export function useVoiceSummon({
  enabled,
  keywords,
  onTrigger,
}: UseVoiceSummonOptions): UseVoiceSummonResult {
  const [supported] = useState(() => getSpeechRecognition() !== undefined);
  const [listening, setListening] = useState(false);

  // onTrigger / keywords の最新値を ref に同期する（認識の中断を避けるため、
  // これらの変化で下の認識 effect を再実行させない）。ref 更新はレンダー中ではなく
  // commit 後の effect で行う。
  const onTriggerRef = useRef(onTrigger);
  const keywordsRef = useRef(keywords);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
    keywordsRef.current = keywords;
  });

  useEffect(() => {
    if (!enabled) return;
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    const recognition: SpeechRecognition = new Ctor();
    recognition.lang = RECOGNITION_LANG;
    recognition.continuous = true;
    recognition.interimResults = true;

    // enabled が落ちた／アンマウントされたら再開を止めるためのフラグ。
    let active = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // 今回更新ぶんの結果だけを走査し、トリガー語を含むか判定する。
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (keywordsRef.current.some((kw) => transcript.includes(kw))) {
          onTriggerRef.current();
          return;
        }
      }
    };

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
      // ブラウザは無音が続くと認識を終了する。バトル中は聞き続けたいので再開する。
      if (active) {
        try {
          recognition.start();
        } catch {
          // 既に開始済みなどで投げられた場合は無視する。
        }
      }
    };

    recognition.onerror = () => {
      // no-speech / aborted などのエラーは無視（onend 経由で再開される）。
    };

    try {
      recognition.start();
    } catch {
      // start 失敗時は何もしない。
    }

    return () => {
      active = false;
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      setListening(false);
    };
  }, [enabled]);

  return { supported, listening };
}
