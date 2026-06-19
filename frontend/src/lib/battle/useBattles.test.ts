import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBattles } from "./useBattles";

const mockUseQuery = vi.fn();
vi.mock("@/lib/api/client", () => ({
  $api: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
}));

describe("useBattles", () => {
  beforeEach(() => mockUseQuery.mockReset());

  it("data が無ければ空配列", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useBattles());

    expect(result.current.battles).toEqual([]);
  });

  it("battles をそのまま返す", () => {
    const battles = [
      { battleId: "1", subjects: ["math"], status: "waiting", opponentName: "明久" },
    ];
    mockUseQuery.mockReturnValue({ data: { battles }, isLoading: false });

    const { result } = renderHook(() => useBattles());

    expect(result.current.battles).toEqual(battles);
  });
});
