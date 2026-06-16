"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  uploadMyAnswerSheet,
  listAnswerSheets,
  getAnswerSheet,
  submitScore,
  type AnswerSheet,
  type AnswerSheetSummary,
  type ExamQuestion,
} from "@/lib/api/grading";
import { Panel, LabelTag, Button, Placeholder } from "@/components/ui";

type Exam = { id: number; title: string; subject: string };

// ─── 共通：試験選択 ────────────────────────────────────────────────────────────

function ExamSelector({ onSelect }: { onSelect: (exam: Exam) => void }) {
  const { data, isLoading } = $api.useQuery("get", "/api/exams");
  const exams = (data as { exams?: Exam[] } | undefined)?.exams ?? [];

  if (isLoading) {
    return <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>;
  }

  if (exams.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-slate-400 text-sm">試験がありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {exams.map((exam) => (
        <button
          key={exam.id}
          onClick={() => onSelect(exam)}
          className="w-full text-left px-5 py-4 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 hover:border-sky-400 hover:bg-sky-400/10 transition-all duration-200"
        >
          <p className="font-bold">{exam.title}</p>
          <p className="text-sm text-slate-400 mt-0.5">{exam.subject}</p>
        </button>
      ))}
    </div>
  );
}

// ─── 生徒：答案アップロード ────────────────────────────────────────────────────

function StudentUploadStep({
  exam,
  onUploaded,
}: {
  exam: Exam;
  onUploaded: (sheet: AnswerSheet) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: upload, isPending } = useMutation({
    mutationFn: () => uploadMyAnswerSheet(exam.id, file!),
    onSuccess: onUploaded,
    onError: (e: Error) => setError(e.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const pdf = f.type === "application/pdf";
    setIsPdf(pdf);
    setPreview(pdf ? null : URL.createObjectURL(f));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="px-4 py-2 bg-sky-400/10 border border-sky-400/30 rounded-sm">
        <p className="text-xs text-sky-400">提出先の試験</p>
        <p className="text-white font-bold mt-0.5">{exam.title}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/60 rounded-sm">
          <LabelTag variant="error">エラー</LabelTag>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <LabelTag variant="required">必須</LabelTag>
          <span className="text-blue-300 text-sm font-semibold">答案ファイル</span>
        </label>

        {file && (
          <div className="relative border border-sky-400/30 rounded-sm overflow-hidden bg-white/5">
            {isPdf ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sky-100 text-sm font-bold">{file.name}</p>
                  <p className="text-slate-400 text-xs">PDF ファイル</p>
                </div>
              </div>
            ) : (
              <img src={preview!} alt="プレビュー" className="w-full max-h-64 object-contain" />
            )}
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); setIsPdf(false); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80"
            >
              ✕
            </button>
          </div>
        )}

        <label className="flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-sky-400/40 rounded-sm cursor-pointer hover:border-sky-400 hover:bg-sky-400/5 transition-all duration-200">
          <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={handleFile} />
          <span className="text-3xl">📎</span>
          <span className="text-sm text-slate-400">画像または PDF を選択</span>
        </label>
      </div>

      <Button onClick={() => upload()} disabled={!file || isPending} fullWidth>
        {isPending ? "アップロード中..." : "アップロードして提出"}
      </Button>
    </div>
  );
}

// ─── 生徒：提出完了 ────────────────────────────────────────────────────────────

function StudentDoneStep({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <span className="text-5xl">✅</span>
      <p className="text-white font-bold text-lg">提出完了！</p>
      <p className="text-slate-400 text-sm text-center">
        先生が採点するまでしばらくお待ちください。
      </p>
      <Button onClick={onReset}>別の試験を提出する</Button>
    </div>
  );
}

// ─── 教師：答案一覧 ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:  { label: "OCR処理中", cls: "text-yellow-300" },
  ocr_done: { label: "採点待ち",  cls: "text-sky-300" },
  scored:   { label: "採点済み",  cls: "text-green-300" },
};

function TeacherSheetList({
  exam,
  onSelect,
}: {
  exam: Exam;
  onSelect: (sheet: AnswerSheetSummary) => void;
}) {
  const { data: sheets, isLoading, refetch } = useQuery({
    queryKey: ["answer_sheets", exam.id],
    queryFn: () => listAnswerSheets(exam.id),
  });

  if (isLoading) {
    return <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>;
  }

  if (!sheets || sheets.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-slate-400 text-sm">まだ提出された答案がありません</p>
        <button onClick={() => refetch()} className="mt-4 text-xs text-sky-400 hover:text-sky-300">
          更新
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-blue-300 text-sm font-semibold">提出された答案</p>
        <button onClick={() => refetch()} className="text-xs text-slate-400 hover:text-sky-300">
          更新
        </button>
      </div>
      {sheets.map((s) => {
        const st = STATUS_LABEL[s.status] ?? { label: s.status, cls: "text-slate-400" };
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="w-full text-left px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm hover:border-sky-400 hover:bg-sky-400/8 transition-all duration-200 flex items-center justify-between"
          >
            <span className="text-sky-100 font-semibold">{s.student_name}</span>
            <span className={`text-xs font-bold ${st.cls}`}>{st.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── 教師：採点 ────────────────────────────────────────────────────────────────

function GradingStep({
  exam,
  sheetSummary,
  onDone,
}: {
  exam: Exam;
  sheetSummary: AnswerSheetSummary;
  onDone: () => void;
}) {
  const [questionScores, setQuestionScores] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: sheet } = useQuery({
    queryKey: ["answer_sheet", exam.id, sheetSummary.id],
    queryFn: () => getAnswerSheet(exam.id, sheetSummary.id),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 3000 : false,
  });

  const totalPoints = sheet?.questions.reduce((s, q) => s + q.points, 0) ?? 0;
  const totalScore = (sheet?.questions ?? []).reduce((s, q) => {
    const v = Number(questionScores[q.id] ?? 0);
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  const { mutate: score, isPending } = useMutation({
    mutationFn: () => submitScore(exam.id, sheetSummary.id, totalScore),
    onSuccess: () => setSubmitted(true),
    onError: (e: Error) => setError(e.message),
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <span className="text-5xl">✅</span>
        <p className="text-white font-bold text-lg">採点完了！</p>
        <p className="text-slate-400 text-sm">合計 {totalScore} / {totalPoints} 点</p>
        <Button onClick={onDone}>答案一覧に戻る</Button>
      </div>
    );
  }

  if (!sheet) {
    return <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="px-4 py-2 bg-sky-400/10 border border-sky-400/30 rounded-sm">
        <p className="text-xs text-sky-400">{exam.title}</p>
        <p className="text-white font-bold mt-0.5">{sheetSummary.student_name}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/60 rounded-sm">
          <LabelTag variant="error">エラー</LabelTag>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {sheet.image_url && (
        <div className="flex flex-col gap-2">
          <p className="text-blue-300 text-sm font-semibold">答案画像</p>
          <img src={sheet.image_url} alt="答案" className="w-full rounded-sm border border-sky-400/30 object-contain max-h-96" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-blue-300 text-sm font-semibold">OCR テキスト</p>
          {sheet.status === "pending" && <LabelTag variant="info">処理中...</LabelTag>}
        </div>
        <div className="px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm min-h-16">
          {sheet.status === "pending" ? (
            <p className="text-slate-400 animate-pulse text-sm">文字を認識しています...</p>
          ) : (
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans">
              {sheet.ocr_text ?? "（テキストなし）"}
            </pre>
          )}
        </div>
      </div>

      {sheet.questions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-blue-300 text-sm font-semibold">問題ごとの採点</p>
          {sheet.questions.map((q: ExamQuestion) => (
            <QuestionScoreRow
              key={q.id}
              question={q}
              value={questionScores[q.id] ?? ""}
              onChange={(v) => setQuestionScores((prev) => ({ ...prev, [q.id]: v }))}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm">
          <p className="text-slate-400 text-sm">問題が登録されていません。</p>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-sky-400/10 border border-sky-400/40 rounded-sm">
        <span className="text-blue-300 font-semibold text-sm">合計点</span>
        <span className="text-white font-black text-xl">
          {totalScore}
          <span className="text-slate-400 text-sm font-normal"> / {totalPoints} 点</span>
        </span>
      </div>

      <Button onClick={() => score()} disabled={isPending || sheet.status === "pending"} fullWidth>
        {isPending ? "送信中..." : "採点を確定する"}
      </Button>
    </div>
  );
}

function QuestionScoreRow({
  question,
  value,
  onChange,
}: {
  question: ExamQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs text-slate-400">問 {question.number}</p>
          <p className="text-sky-100 text-sm mt-0.5">{question.question_text}</p>
        </div>
        <LabelTag variant="info">{question.points}点</LabelTag>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 text-xs text-slate-400">
          <span className="text-sky-400">模範解答：</span>{question.model_answer}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={question.points}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="点数"
            className="w-20 px-2 py-1.5 bg-white/5 border border-sky-400/40 rounded-sm text-sky-100 text-sm text-right outline-none focus:border-sky-400"
          />
          <span className="text-slate-400 text-xs">点</span>
        </div>
      </div>
    </div>
  );
}

// ─── SubmitScreen（メイン） ────────────────────────────────────────────────────

export function SubmitScreen() {
  const { user } = useCurrentUser();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [sheet, setSheet] = useState<AnswerSheet | null>(null);
  const [selectedSheetSummary, setSelectedSheetSummary] = useState<AnswerSheetSummary | null>(null);
  const [studentDone, setStudentDone] = useState(false);

  const reset = useCallback(() => {
    setSelectedExam(null);
    setSheet(null);
    setSelectedSheetSummary(null);
    setStudentDone(false);
  }, []);

  if (!user) return null;

  const isTeacher = user.role === "teacher" || user.role === "school_admin";
  const title = isTeacher ? "OCR 採点" : "答案を提出";

  const currentStep = () => {
    if (!selectedExam) return "exam";
    if (isTeacher) {
      if (!selectedSheetSummary) return "list";
      return "grade";
    } else {
      if (studentDone) return "done";
      return "upload";
    }
  };

  const stepLabel = () => {
    switch (currentStep()) {
      case "exam":   return "試験を選ぶ";
      case "upload": return "答案をアップロード";
      case "done":   return "提出完了";
      case "list":   return "答案一覧";
      case "grade":  return "採点";
    }
  };

  return (
    <Panel className="mx-auto mt-6 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
        <LabelTag variant="info">{isTeacher ? "採点" : "提出"}</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
          {title}
        </h1>
      </div>

      {/* パンくず */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-sky-400/20 bg-black/10 text-xs text-slate-400">
        <button onClick={reset} className={selectedExam ? "hover:text-sky-300" : "text-sky-300 font-semibold"}>
          試験選択
        </button>
        {selectedExam && (
          <>
            <span>›</span>
            <button
              onClick={() => { setSelectedSheetSummary(null); setStudentDone(false); setSheet(null); }}
              className={currentStep() === "exam" ? "" : (currentStep() === "list" || currentStep() === "upload" ? "text-sky-300 font-semibold" : "hover:text-sky-300")}
            >
              {isTeacher ? "答案一覧" : "アップロード"}
            </button>
          </>
        )}
        {selectedSheetSummary && (
          <>
            <span>›</span>
            <span className="text-sky-300 font-semibold">採点</span>
          </>
        )}
        {studentDone && (
          <>
            <span>›</span>
            <span className="text-sky-300 font-semibold">提出完了</span>
          </>
        )}
        <span className="ml-auto text-slate-500">{stepLabel()}</span>
      </div>

      <div className="px-5 py-6">
        {currentStep() === "exam" && (
          <ExamSelector onSelect={setSelectedExam} />
        )}

        {/* 生徒フロー */}
        {currentStep() === "upload" && selectedExam && (
          <StudentUploadStep
            exam={selectedExam}
            onUploaded={(s) => { setSheet(s); setStudentDone(true); }}
          />
        )}
        {currentStep() === "done" && (
          <StudentDoneStep onReset={reset} />
        )}

        {/* 教師フロー */}
        {currentStep() === "list" && selectedExam && (
          <TeacherSheetList
            exam={selectedExam}
            onSelect={setSelectedSheetSummary}
          />
        )}
        {currentStep() === "grade" && selectedExam && selectedSheetSummary && (
          <GradingStep
            exam={selectedExam}
            sheetSummary={selectedSheetSummary}
            onDone={() => setSelectedSheetSummary(null)}
          />
        )}
      </div>
    </Panel>
  );
}
