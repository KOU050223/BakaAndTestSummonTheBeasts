import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "./AdminDashboard";

const queryResponses = vi.hoisted(() => ({
  users: {
    data: { stats: { total_count: 12 }, users: [] },
    isLoading: false,
    isError: false,
  },
  exams: {
    data: {
      exams: [
        { id: 1, status: "published" },
        { id: 2, status: "draft" },
      ],
    },
  },
  battles: { data: { battles: [] } },
}));

vi.mock("@/lib/api/client", () => ({
  $api: {
    useQuery: (_method: string, path: string) => {
      if (path === "/api/admin/users") {
        return queryResponses.users;
      }
      if (path === "/api/exams") {
        return queryResponses.exams;
      }
      return queryResponses.battles;
    },
  },
}));

vi.mock("@/lib/api/grading", () => ({
  listAnswerSheets: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/dashboard/ClassAverageScoreChart", () => ({
  ClassAverageScoreChart: ({
    title,
    maximumLabel,
  }: {
    title: string;
    maximumLabel: string;
  }) => (
    <section>
      <h2>{title}</h2>
      <p>{maximumLabel}</p>
    </section>
  ),
}));

describe("AdminDashboard", () => {
  it("管理者向けの平易な呼称で管理指標を表示する", () => {
    render(<AdminDashboard />);

    expect(
      screen.getByRole("heading", {
        name: "管理者ダッシュボード",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("ユーザー数")).toBeInTheDocument();
    expect(screen.getByText("公開済み試験数")).toBeInTheDocument();
    expect(screen.getByText("クラス別平均スコア")).toBeInTheDocument();
    expect(screen.getByText("最高点は")).toBeInTheDocument();
    expect(screen.getByLabelText("文月学園")).toBeInTheDocument();
  });
});
