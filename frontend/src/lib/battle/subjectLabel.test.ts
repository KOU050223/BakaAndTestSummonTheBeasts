import { describe, expect, it } from "vitest";
import { subjectLabel } from "./subjectLabel";

describe("subjectLabel", () => {
  it("既知の科目コードを日本語ラベルに変換する", () => {
    expect(subjectLabel("math")).toBe("数学");
    expect(subjectLabel("english")).toBe("英語");
    expect(subjectLabel("japanese")).toBe("国語");
  });

  it("未知のコードはそのまま返す", () => {
    expect(subjectLabel("unknown_subject")).toBe("unknown_subject");
  });
});
