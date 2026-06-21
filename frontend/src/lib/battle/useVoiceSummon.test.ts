import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVoiceSummon } from "./useVoiceSummon";

// SpeechRecognition のモック実装。
// start/stop と onresult の発火を手動で制御し、フックの挙動を検証する。
class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  started = false;
  stopped = false;

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  start() {
    this.started = true;
    this.onstart?.();
  }

  stop() {
    this.stopped = true;
  }

  abort() {
    this.stopped = true;
  }

  // 認識結果を発火するテスト用ヘルパー。
  emit(transcript: string) {
    this.onresult?.({
      results: [[{ transcript }]],
      resultIndex: 0,
    });
  }
}

function setSpeechRecognition(ctor: unknown) {
  (globalThis as Record<string, unknown>).SpeechRecognition = ctor;
  (globalThis as Record<string, unknown>).webkitSpeechRecognition = ctor;
}

describe("useVoiceSummon", () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    setSpeechRecognition(MockSpeechRecognition);
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
    vi.restoreAllMocks();
  });

  it("API 非対応なら supported=false で何もしない", () => {
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;

    const onTrigger = vi.fn();
    const { result } = renderHook(() =>
      useVoiceSummon({ enabled: true, keywords: ["サモン"], onTrigger }),
    );

    expect(result.current.supported).toBe(false);
    expect(MockSpeechRecognition.instances).toHaveLength(0);
  });

  it("enabled=true で認識を開始する", () => {
    const onTrigger = vi.fn();
    renderHook(() => useVoiceSummon({ enabled: true, keywords: ["サモン"], onTrigger }));

    expect(MockSpeechRecognition.instances).toHaveLength(1);
    expect(MockSpeechRecognition.instances[0].started).toBe(true);
  });

  it("enabled=false の間は認識を開始しない", () => {
    const onTrigger = vi.fn();
    renderHook(() => useVoiceSummon({ enabled: false, keywords: ["サモン"], onTrigger }));

    expect(MockSpeechRecognition.instances).toHaveLength(0);
  });

  it("キーワードを含む発話で onTrigger を呼ぶ", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useVoiceSummon({ enabled: true, keywords: ["サモン", "召喚"], onTrigger }),
    );

    MockSpeechRecognition.instances[0].emit("いまだサモン");
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("別表記キーワードでも発火する", () => {
    const onTrigger = vi.fn();
    renderHook(() =>
      useVoiceSummon({ enabled: true, keywords: ["サモン", "召喚"], onTrigger }),
    );

    MockSpeechRecognition.instances[0].emit("召喚する");
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("キーワードを含まない発話では発火しない", () => {
    const onTrigger = vi.fn();
    renderHook(() => useVoiceSummon({ enabled: true, keywords: ["サモン"], onTrigger }));

    MockSpeechRecognition.instances[0].emit("こんにちは");
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("アンマウント時に認識を停止する", () => {
    const onTrigger = vi.fn();
    const { unmount } = renderHook(() =>
      useVoiceSummon({ enabled: true, keywords: ["サモン"], onTrigger }),
    );

    const instance = MockSpeechRecognition.instances[0];
    unmount();
    expect(instance.stopped).toBe(true);
  });
});
