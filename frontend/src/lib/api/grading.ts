const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type ExamQuestion = {
  id: number;
  number: number;
  question_text: string;
  model_answer: string;
  points: number;
};

export type AnswerSheet = {
  id: number;
  status: "pending" | "ocr_done" | "scored";
  ocr_text: string | null;
  student_id: number;
  image_url: string | null;
  questions: ExamQuestion[];
};

export type AnswerSheetSummary = {
  id: number;
  status: "pending" | "ocr_done" | "scored";
  student_id: number;
  student_name: string;
  updated_at: string;
};

export async function listAnswerSheets(examId: string | number): Promise<AnswerSheetSummary[]> {
  const res = await fetch(`${API_BASE}/api/exams/${examId}/answer_sheets`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("答案一覧の取得に失敗しました");
  const data = await res.json() as { answer_sheets: AnswerSheetSummary[] };
  return data.answer_sheets;
}

// 生徒自身がアップロードする（student_id は不要）
export async function uploadMyAnswerSheet(
  examId: string | number,
  image: File,
): Promise<AnswerSheet> {
  const body = new FormData();
  body.append("image", image);
  const res = await fetch(`${API_BASE}/api/exams/${examId}/answer_sheets`, {
    method: "POST",
    credentials: "include",
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "アップロードに失敗しました");
  }
  return res.json() as Promise<AnswerSheet>;
}

// 教師が生徒を指定してアップロードする
export async function uploadAnswerSheet(
  examId: string | number,
  studentId: string,
  image: File,
): Promise<AnswerSheet> {
  const body = new FormData();
  body.append("student_id", studentId);
  body.append("image", image);

  const res = await fetch(`${API_BASE}/api/exams/${examId}/answer_sheets`, {
    method: "POST",
    credentials: "include",
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "アップロードに失敗しました");
  }
  return res.json() as Promise<AnswerSheet>;
}

export async function getAnswerSheet(
  examId: string | number,
  sheetId: number,
): Promise<AnswerSheet> {
  const res = await fetch(
    `${API_BASE}/api/exams/${examId}/answer_sheets/${sheetId}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("解答用紙の取得に失敗しました");
  return res.json() as Promise<AnswerSheet>;
}

export async function submitScore(
  examId: string | number,
  sheetId: number,
  totalScore: number,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/exams/${examId}/answer_sheets/${sheetId}/score`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_score: totalScore }),
    },
  );
  if (!res.ok) throw new Error("採点の送信に失敗しました");
}
