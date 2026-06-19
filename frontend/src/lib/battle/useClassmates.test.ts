import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useClassmates } from "./useClassmates";

const mockUseQuery = vi.fn();
vi.mock("@/lib/api/client", () => ({
  $api: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
}));

describe("useClassmates", () => {
  beforeEach(() => mockUseQuery.mockReset());

  it("classId 未指定の間はリクエストを無効化する", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    renderHook(() => useClassmates(undefined, 1));

    expect(mockUseQuery.mock.calls[0][3].enabled).toBe(false);
  });

  it("自分自身を候補から除外する", () => {
    mockUseQuery.mockReturnValue({
      data: {
        classId: 1,
        students: [
          { id: 1, name: "自分", grade: 1, totalScore: 0, topSubject: { name: "数学", score: 0 } },
          { id: 2, name: "相手", grade: 1, totalScore: 0, topSubject: { name: "英語", score: 0 } },
        ],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useClassmates(1, 1));

    expect(result.current.classmates.map((s) => s.id)).toEqual([2]);
  });

  it("data が無ければ空配列", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useClassmates(1, 1));

    expect(result.current.classmates).toEqual([]);
  });
});
