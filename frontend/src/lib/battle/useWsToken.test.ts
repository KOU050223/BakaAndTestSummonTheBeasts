import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWsToken } from "./useWsToken";

const mockUseQuery = vi.fn();
vi.mock("@/lib/api/client", () => ({
  $api: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
}));

describe("useWsToken", () => {
  beforeEach(() => mockUseQuery.mockReset());

  it("battleId 未指定の間はリクエストを無効化する（enabled: false）", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    renderHook(() => useWsToken(undefined));

    const options = mockUseQuery.mock.calls[0][3];
    expect(options.enabled).toBe(false);
  });

  it("battleId をパスパラメータに渡す", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    renderHook(() => useWsToken("42"));

    const params = mockUseQuery.mock.calls[0][2];
    expect(params.params.path.id).toBe("42");
    expect(mockUseQuery.mock.calls[0][3].enabled).toBe(true);
  });

  it("data があれば token を返す", () => {
    mockUseQuery.mockReturnValue({ data: { token: "jwt-abc" }, isLoading: false, isError: false });

    const { result } = renderHook(() => useWsToken("1"));

    expect(result.current.token).toBe("jwt-abc");
  });

  it("data が無ければ token は undefined", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const { result } = renderHook(() => useWsToken("1"));

    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });
});
