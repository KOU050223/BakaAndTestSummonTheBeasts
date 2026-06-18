import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useMyScores } from "./useMyScores";
import type { MyScore } from "@/lib/api/grading";

const mockGetMyScores = vi.fn();
vi.mock("@/lib/api/grading", () => ({
  getMyScores: () => mockGetMyScores(),
}));

function score(partial: Partial<MyScore>): MyScore {
  return {
    exam_id: 1,
    exam_title: "テスト",
    subject: "math",
    score: 80,
    max_score: 100,
    scored_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

// 各テストで独立した QueryClient を使い、キャッシュ汚染を避ける。
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

describe("useMyScores", () => {
  beforeEach(() => {
    mockGetMyScores.mockReset();
  });

  it("enabled が false の間はフェッチせず空集計を返す", () => {
    const { result } = renderHook(() => useMyScores(false), { wrapper });

    expect(mockGetMyScores).not.toHaveBeenCalled();
    expect(result.current.summary).toEqual({
      scores: [],
      bySubject: {},
      total: 0,
      max: 0,
    });
  });

  it("total と max を全科目で合計する", async () => {
    mockGetMyScores.mockResolvedValue([
      score({ subject: "math", score: 88, max_score: 100 }),
      score({ subject: "english", score: 94, max_score: 100 }),
    ]);

    const { result } = renderHook(() => useMyScores(true), { wrapper });

    await waitFor(() => expect(result.current.summary.scores).toHaveLength(2));
    expect(result.current.summary.total).toBe(182);
    expect(result.current.summary.max).toBe(200);
  });

  it("同一科目に複数試験があるとき scored_at が新しい方を bySubject に採用する", async () => {
    mockGetMyScores.mockResolvedValue([
      score({ subject: "math", score: 50, scored_at: "2026-01-01T00:00:00Z" }),
      score({ subject: "math", score: 90, scored_at: "2026-03-01T00:00:00Z" }),
    ]);

    const { result } = renderHook(() => useMyScores(true), { wrapper });

    await waitFor(() => expect(result.current.summary.scores).toHaveLength(2));
    // bySubject は最新（3月・90点）を指す
    expect(result.current.summary.bySubject.math.score).toBe(90);
    // total はあくまで全件の合計（科目集約はしない）
    expect(result.current.summary.total).toBe(140);
  });
});
