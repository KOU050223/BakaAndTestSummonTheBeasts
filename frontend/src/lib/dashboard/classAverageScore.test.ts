import { describe, expect, it } from "vitest";
import {
  formatClassAverageScore,
  scoreBarColor,
  scoreBarRatio,
  sortClassesByGradeAndName,
  subjectMaxScore,
} from "./classAverageScore";
import type { ClassSummary } from "@/lib/api/types";

const sample = (overrides: Partial<ClassSummary>): ClassSummary => ({
  id: 1,
  name: "Aクラス",
  grade: 2,
  averageScore: 100,
  studentCount: 5,
  subjectAverages: [],
  ...overrides,
});

describe("classAverageScore", () => {
  it("スコア平均を桁区切りで表示する", () => {
    expect(formatClassAverageScore(1784)).toBe("1,784");
  });

  it("学年最高点を基準にバー比率を算出する", () => {
    expect(scoreBarRatio(90, 180)).toBeCloseTo(0.5);
    expect(scoreBarRatio(200, 180)).toBe(1);
  });

  it("上限が 0 のときバー比率は 0", () => {
    expect(scoreBarRatio(0, 0)).toBe(0);
  });

  it("相対位置に応じてバー色を返す", () => {
    expect(scoreBarColor(180, 180)).toBe("bg-emerald-400");
    expect(scoreBarColor(100, 180)).toBe("bg-amber-400");
    expect(scoreBarColor(50, 180)).toBe("bg-red-500");
  });

  it("クラスを学年・名称順に並べる", () => {
    const sorted = sortClassesByGradeAndName([
      sample({ id: 2, name: "Bクラス", grade: 2 }),
      sample({ id: 1, name: "Aクラス", grade: 2 }),
      sample({ id: 3, name: "Aクラス", grade: 1 }),
    ]);
    expect(sorted.map((c) => `${c.grade}-${c.name}`)).toEqual([
      "1-Aクラス",
      "2-Aクラス",
      "2-Bクラス",
    ]);
  });

  it("教科別最高点マップから上限を取得する", () => {
    expect(subjectMaxScore({ math: 95, english: 88 }, "math")).toBe(95);
    expect(subjectMaxScore({ math: 95 }, "english")).toBe(0);
  });
});
