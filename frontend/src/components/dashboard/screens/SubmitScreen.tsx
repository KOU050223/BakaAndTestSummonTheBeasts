"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  uploadAnswerSheet,
  getAnswerSheet,
  submitScore,
  type AnswerSheet,
  type ExamQuestion,
} from "@/lib/api/grading";
import { Panel, LabelTag, Button, Placeholder } from "@/components/ui";

// ─── 型 ───────────────────────────────────────────────────────────────────────

type Exam = { id: string; title: string; subjectId: string };
type Student = { id: string; name: string };
type SchoolClass = { id: string; name: string };

// ─── Step1: 試験選択 ──────────────────────────────────────────────────────────

function ExamSelector({ onSelect }: { onSelect: (exam: Exam) => void }) {
  const { data, isLoading } = $api.useQuery("get", "/api/exams");
  const exams = (data as { exams?: Exam[] } | undefined)?.exams ?? [];

  if (isLoading) {
    return (
      <p className="text-sky-300 animate-pulse text-center py-10">
        試験一覧を読み込み中...
      </p>
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
          <p className="text-sm text-slate-400 mt-0.5">{exam.subjectId}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Step2: 生徒選択 + 画像アップロード ──────────────────────────────────────

function UploadStep({
  exam,
  onUploaded,
}: {
  exam: Exam;
  onUploaded: (sheet: AnswerSheet) => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: classesData } = $api.useQuery("get", "/api/classes");
  const classes = (classesData as { classes?: SchoolClass[] } | undefined)?.classes ?? [];

  const { data: studentsData } = $api.useQuery(
    "get",
    "/api/classes/{class_id}/students",
    { params: { path: { class_id: selectedClassId } } },
    { enabled: !!selectedClassId },
  );
  const students = (studentsData as { students?: Student[] } | undefined)?.students ?? [];

  const { mutate: upload, isPending } = useMutation({
    mutationFn: () => uploadAnswerSheet(exam.id, selectedStudentId, image!),
    onSuccess: onUploaded,
    onError: (e: Error) => setError(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pdf = file.type === "application/pdf";
    setImage(file);
    setIsPdf(pdf);
    setPreview(pdf ? null : URL.createObjectURL(file));
  };

  const canSubmit = selectedStudentId && image && !isPending;

  return (
    <div className="flex flex-col gap-5">
      <div className="px-4 py-2 bg-sky-400/10 border border-sky-400/30 rounded-sm">
        <p className="text-xs text-sky-400">選択中の試験</p>
        <p className="text-white font-bold mt-0.5">{exam.title}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/60 rounded-sm">
          <LabelTag variant="error">エラー</LabelTag>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* クラス選択 */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <LabelTag variant="required">必須</LabelTag>
          <span className="text-blue-300 text-sm font-semibold">クラス</span>
        </label>
        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setSelectedStudentId("");
          }}
          className="w-full px-3.5 py-2.5 bg-white/5 border border-sky-400/40 rounded-sm text-sky-100 text-base outline-none focus:border-sky-400"
        >
          <option value="">クラスを選択</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 生徒選択 */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <LabelTag variant="required">必須</LabelTag>
          <span className="text-blue-300 text-sm font-semibold">生徒</span>
        </label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={!selectedClassId}
          className="w-full px-3.5 py-2.5 bg-white/5 border border-sky-400/40 rounded-sm text-sky-100 text-base outline-none focus:border-sky-400 disabled:opacity-50"
        >
          <option value="">生徒を選択</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* 答案アップロード */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <LabelTag variant="required">必須</LabelTag>
          <span className="text-blue-300 text-sm font-semibold">答案ファイル</span>
        </label>

        {/* プレビュー or PDFファイル名表示 */}
        {image && (
          <div className="relative w-full border border-sky-400/30 rounded-sm overflow-hidden bg-white/5">
            {isPdf ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="text-sky-100 text-sm font-bold">{image.name}</p>
                  <p className="text-slate-400 text-xs">PDF ファイル</p>
                </div>
              </div>
            ) : (
              <img
                src={preview!}
                alt="プレビュー"
                className="w-full max-h-64 object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => { setImage(null); setPreview(null); setIsPdf(false); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80"
            >
              ✕
            </button>
          </div>
        )}

        {/* ボタン群 */}
        <div className="grid grid-cols-2 gap-2">
          {/* ファイル選択（画像＋PDF） */}
          <label className="flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-sky-400/40 rounded-sm cursor-pointer hover:border-sky-400 hover:bg-sky-400/5 transition-all duration-200">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="text-2xl">🖼️</span>
            <span className="text-xs text-slate-400">画像 / PDF</span>
          </label>

          {/* カメラで撮影 */}
          <label className="flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-sky-400/40 rounded-sm cursor-pointer hover:border-sky-400 hover:bg-sky-400/5 transition-all duration-200">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="text-2xl">📷</span>
            <span className="text-xs text-slate-400">カメラで撮影</span>
          </label>
        </div>
      </div>

      <Button
        onClick={() => upload()}
        disabled={!canSubmit}
        fullWidth
      >
        {isPending ? "アップロード中..." : "アップロードして OCR 開始"}
      </Button>
    </div>
  );
}

// ─── Step3: OCR確認 & 採点 ────────────────────────────────────────────────────

function GradingStep({
  exam,
  sheet: initialSheet,
  onDone,
}: {
  exam: Exam;
  sheet: AnswerSheet;
  onDone: () => void;
}) {
  const [questionScores, setQuestionScores] = useState<Record<number, string>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OCR完了まで3秒ごとにポーリング
  const { data: sheet } = useQuery({
    queryKey: ["answer_sheet", exam.id, initialSheet.id],
    queryFn: () => getAnswerSheet(exam.id, initialSheet.id),
    initialData: initialSheet,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 3000 : false,
  });

  const totalPoints = sheet.questions.reduce((sum, q) => sum + q.points, 0);
  const totalScore = sheet.questions.reduce((sum, q) => {
    const v = Number(questionScores[q.id] ?? 0);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const { mutate: score, isPending } = useMutation({
    mutationFn: () => submitScore(exam.id, sheet.id, totalScore),
    onSuccess: () => setSubmitted(true),
    onError: (e: Error) => setError(e.message),
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <span className="text-5xl">✅</span>
        <p className="text-white font-bold text-lg">採点完了！</p>
        <p className="text-slate-400 text-sm">
          合計 {totalScore} / {totalPoints} 点
        </p>
        <Button onClick={onDone}>別の答案を採点する</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="px-4 py-2 bg-sky-400/10 border border-sky-400/30 rounded-sm">
        <p className="text-xs text-sky-400">採点中の試験</p>
        <p className="text-white font-bold mt-0.5">{exam.title}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/60 rounded-sm">
          <LabelTag variant="error">エラー</LabelTag>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* 答案画像 */}
      {sheet.image_url && (
        <div className="flex flex-col gap-2">
          <p className="text-blue-300 text-sm font-semibold">答案画像</p>
          <img
            src={sheet.image_url}
            alt="答案"
            className="w-full rounded-sm border border-sky-400/30 object-contain max-h-96"
          />
        </div>
      )}

      {/* OCR結果 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-blue-300 text-sm font-semibold">OCR テキスト</p>
          {sheet.status === "pending" && (
            <LabelTag variant="info">OCR 処理中...</LabelTag>
          )}
        </div>
        <div className="px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm min-h-20">
          {sheet.status === "pending" ? (
            <p className="text-slate-400 animate-pulse text-sm">
              文字を認識しています...
            </p>
          ) : (
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans">
              {sheet.ocr_text ?? "（テキストなし）"}
            </pre>
          )}
        </div>
      </div>

      {/* 問題ごと採点 */}
      {sheet.questions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-blue-300 text-sm font-semibold">問題ごとの採点</p>
          {sheet.questions.map((q: ExamQuestion) => (
            <QuestionScoreRow
              key={q.id}
              question={q}
              value={questionScores[q.id] ?? ""}
              onChange={(v) =>
                setQuestionScores((prev) => ({ ...prev, [q.id]: v }))
              }
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm">
          <p className="text-slate-400 text-sm">
            この試験には問題が登録されていません。
            <br />
            問題を登録してから採点してください。
          </p>
        </div>
      )}

      {/* 合計 & 送信 */}
      <div className="flex items-center justify-between px-4 py-3 bg-sky-400/10 border border-sky-400/40 rounded-sm">
        <span className="text-blue-300 font-semibold text-sm">合計点</span>
        <span className="text-white font-black text-xl">
          {totalScore}
          <span className="text-slate-400 text-sm font-normal">
            {" "}
            / {totalPoints} 点
          </span>
        </span>
      </div>

      <Button
        onClick={() => score()}
        disabled={isPending || sheet.status === "pending"}
        fullWidth
      >
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
          <span className="text-sky-400">模範解答：</span>
          {question.model_answer}
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

// ─── SubmitScreen (メイン) ────────────────────────────────────────────────────

type Step = "exam" | "upload" | "grade";

export function SubmitScreen() {
  const { user } = useCurrentUser();
  const [step, setStep] = useState<Step>("exam");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [sheet, setSheet] = useState<AnswerSheet | null>(null);

  const isTeacher = user?.role === "teacher" || user?.role === "school_admin";

  if (!isTeacher) {
    return <Placeholder title="答案を提出" />;
  }

  const reset = useCallback(() => {
    setStep("exam");
    setSelectedExam(null);
    setSheet(null);
  }, []);

  const stepLabels: Record<Step, string> = {
    exam: "試験を選ぶ",
    upload: "答案をアップロード",
    grade: "OCR確認・採点",
  };

  const steps: Step[] = ["exam", "upload", "grade"];

  return (
    <Panel className="mx-auto mt-6 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
        <LabelTag variant="info">採点</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
          OCR 採点
        </h1>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center px-5 py-3 border-b border-sky-400/20 bg-black/10">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === s
                    ? "bg-sky-400 text-slate-900"
                    : steps.indexOf(step) > i
                      ? "bg-sky-400/30 text-sky-300"
                      : "bg-white/10 text-slate-500"
                }`}
              >
                {steps.indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs truncate ${step === s ? "text-sky-300 font-semibold" : "text-slate-500"}`}
              >
                {stepLabels[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-sky-400/20 mx-2 min-w-2" />
            )}
          </div>
        ))}
      </div>

      {/* コンテンツ */}
      <div className="px-5 py-6">
        {step === "exam" && (
          <ExamSelector
            onSelect={(exam) => {
              setSelectedExam(exam);
              setStep("upload");
            }}
          />
        )}

        {step === "upload" && selectedExam && (
          <>
            <button
              onClick={() => setStep("exam")}
              className="mb-4 text-xs text-slate-400 hover:text-sky-300 flex items-center gap-1"
            >
              ← 試験選択に戻る
            </button>
            <UploadStep
              exam={selectedExam}
              onUploaded={(s) => {
                setSheet(s);
                setStep("grade");
              }}
            />
          </>
        )}

        {step === "grade" && selectedExam && sheet && (
          <>
            <button
              onClick={() => {
                setStep("upload");
                setSheet(null);
              }}
              className="mb-4 text-xs text-slate-400 hover:text-sky-300 flex items-center gap-1"
            >
              ← 別の答案をアップロード
            </button>
            <GradingStep exam={selectedExam} sheet={sheet} onDone={reset} />
          </>
        )}
      </div>
    </Panel>
  );
}
