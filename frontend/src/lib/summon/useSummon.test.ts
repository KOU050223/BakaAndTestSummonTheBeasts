import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSummon } from "./useSummon";

const mockUseQuery = vi.fn();
vi.mock("@/lib/api/client", () => ({
  $api: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
}));

describe("useSummon", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("studentId が未指定の間はリクエストを無効化する（enabled: false）", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    renderHook(() => useSummon(undefined));

    // 第4引数のオプションに enabled: false が渡る
    const options = mockUseQuery.mock.calls[0][3];
    expect(options.enabled).toBe(false);
  });

  it("data が undefined のとき summons は空配列にフォールバックする", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    const { result } = renderHook(() => useSummon(1));

    expect(result.current.summons).toEqual([]);
  });

  it("data があれば summons をそのまま返す", () => {
    const summons = [
      { code: "math", label: "数学", hp: 144, attack: 35, defense: 13, speed: 9 },
    ];
    mockUseQuery.mockReturnValue({ data: { studentId: "1", summons }, isLoading: false, isError: false });

    const { result } = renderHook(() => useSummon(1));

    expect(result.current.summons).toEqual(summons);
  });
});
