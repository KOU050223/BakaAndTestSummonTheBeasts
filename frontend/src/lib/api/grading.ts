const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type ExamQuestion = {
  id: number;
  number: number;
  question_text: string;
  model_answer: string;
  points: number;
};

export type ExamDetail = {
  answer_key_attached: boolean;
  questions: ExamQuestion[];
};

export type AiGrading =
  | null
  | { status: "processing" }
  | { status: "failed" }
  | { status: "done"; results: Record<number, boolean> };

export type AnswerSheet = {
  id: number;
  status: "pending" | "ocr_done" | "scored";
  student_id: number;
  image_url: string | null;
  image_content_type: string | null;
  answer_key_url: string | null;
  answer_key_content_type: string | null;
  ai_grading: AiGrading;
  questions: ExamQuestion[];
};

export type MyScore = {
  exam_id: number;
  exam_title: string;
  subject: string;
  subject_label: string;
  score: number;
  max_score: number;
  scored_at: string;
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

export async function getExamDetail(examId: string | number): Promise<ExamDetail> {
  const res = await fetch(`${API_BASE}/api/exams/${examId}/questions`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("試験情報の取得に失敗しました");
  return res.json() as Promise<ExamDetail>;
}

export async function uploadAnswerKey(examId: string | number, file: File): Promise<void> {
  const body = new FormData();
  body.append("answer_key_file", file);
  const res = await fetch(`${API_BASE}/api/exams/${examId}/upload_answer_key`, {
    method: "POST",
    credentials: "include",
    body,
  });
  if (!res.ok) throw new Error("解答PDFのアップロードに失敗しました");
}

export type QuestionInput = {
  number: number;
  question_text: string;
  model_answer: string;
  points: number;
};

export async function getMyScores(): Promise<MyScore[]> {
  const res = await fetch(`${API_BASE}/api/scores`, { credentials: "include" });
  if (!res.ok) throw new Error("成績の取得に失敗しました");
  const data = await res.json() as { scores: MyScore[] };
  return data.scores;
}

export async function regradeAnswerSheet(
  examId: string | number,
  sheetId: number,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/exams/${examId}/answer_sheets/${sheetId}/regrade`,
    { method: "POST", credentials: "include" },
  );
  if (!res.ok) throw new Error("再採点のリクエストに失敗しました");
}

export async function createClass(params: {
  name: string;
  grade: number;
}): Promise<{ id: number; name: string; grade: number }> {
  const res = await fetch(`${API_BASE}/api/classes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "クラスの作成に失敗しました");
  }
  return res.json() as Promise<{ id: number; name: string; grade: number }>;
}

export async function createExam(params: {
  title: string;
  subject: string;
  classId: number;
  maxScore: number;
}): Promise<{ id: number; title: string; subject: string }> {
  const res = await fetch(`${API_BASE}/api/exams`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: params.title,
      subject: params.subject,
      class_id: params.classId,
      max_score: params.maxScore,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "試験の作成に失敗しました");
  }
  return res.json() as Promise<{ id: number; title: string; subject: string }>;
}

export async function registerQuestions(
  examId: string | number,
  questions: QuestionInput[],
): Promise<ExamQuestion[]> {
  const res = await fetch(`${API_BASE}/api/exams/${examId}/questions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions }),
  });
  if (!res.ok) throw new Error("問題の登録に失敗しました");
  const data = await res.json() as { questions: ExamQuestion[] };
  return data.questions;
}
