import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOpponents } from "./useOpponents";

const mockUseQuery = vi.fn();
vi.mock("@/lib/api/client", () => ({
  $api: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
}));

describe("useOpponents", () => {
  beforeEach(() => mockUseQuery.mockReset());

  it("opponents をそのまま返す", () => {
    const opponents = [
      { id: 2, name: "明久" },
      { id: 3, name: "雄二" },
    ];
    mockUseQuery.mockReturnValue({ data: { opponents }, isLoading: false });

    const { result } = renderHook(() => useOpponents());

    expect(result.current.opponents).toEqual(opponents);
  });

  it("data が無ければ空配列", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useOpponents());

    expect(result.current.opponents).toEqual([]);
  });
});
