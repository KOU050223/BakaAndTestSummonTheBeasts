"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { navLabel } from "@/lib/dashboard/navigation";
import {
  uploadMyAnswerSheet,
  listAnswerSheets,
  getAnswerSheet,
  submitScore,
  getExamDetail,
  uploadAnswerKey,
  registerQuestions,
  regradeAnswerSheet,
  type AnswerSheet,
  type AnswerSheetSummary,
  type ExamQuestion,
  type ExamDetail,
  type QuestionInput,
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
                  <p className="text-slate-400 text-xs">PDF / 画像ファイル</p>
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

// ─── 教師：解答PDF + 問題設定 ─────────────────────────────────────────────────

const emptyQuestion = (): QuestionInput => ({
  number: 1,
  question_text: "",
  model_answer: "",
  points: 100,
});


function distributePoints(count: number): number[] {
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? base + remainder : base
  );
}

function QuestionSetupStep({
  exam,
  onNext,
}: {
  exam: Exam;
  onNext: () => void;
}) {
  const { data: detail, isLoading, refetch } = useQuery<ExamDetail>({
    queryKey: ["exam_detail", exam.id],
    queryFn: () => getExamDetail(exam.id),
  });

  const [rows, setRows] = useState<QuestionInput[]>([emptyQuestion()]);
  const [countInput, setCountInput] = useState("1");
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rowsInitialized = useRef(false);

  // DB保存済み問題をロード（初回のみ）
  useEffect(() => {
    if (rowsInitialized.current || !detail?.questions?.length) return;
    rowsInitialized.current = true;
    const loaded = detail.questions.map((q) => ({
      number: q.number, question_text: "", model_answer: "", points: q.points,
    }));
    setRows(loaded);
    setCountInput(String(loaded.length));
  }, [detail]);

  const { mutate: uploadKey, isPending: uploadingKey } = useMutation({
    mutationFn: () => uploadAnswerKey(exam.id, keyFile!),
    onSuccess: () => {
      setKeyFile(null);
      rowsInitialized.current = false;
      refetch();
    },
    onError: (e: Error) => setError(e.message),
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => registerQuestions(exam.id, rows.map((r, i) => ({ ...r, number: i + 1 }))),
    onSuccess: onNext,
    onError: (e: Error) => setError(e.message),
  });

  const updateRow = (i: number, field: keyof QuestionInput, value: string | number) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addRow = () => {
    const newCount = rows.length + 1;
    const pts = distributePoints(newCount);
    setRows((prev) =>
      [...prev, { ...emptyQuestion(), number: newCount }].map((r, i) => ({ ...r, points: pts[i] }))
    );
    setCountInput(String(newCount));
  };
  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    const pts = distributePoints(next.length);
    setRows(next.map((r, idx) => ({ ...r, number: idx + 1, points: pts[idx] })));
    setCountInput(String(next.length));
  };

  if (isLoading) {
    return <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="px-4 py-2 bg-sky-400/10 border border-sky-400/30 rounded-sm">
        <p className="text-xs text-sky-400">試験</p>
        <p className="text-white font-bold mt-0.5">{exam.title}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/60 rounded-sm">
          <LabelTag variant="error">エラー</LabelTag>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* 解答ファイル アップロード */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-blue-300 text-sm font-semibold">解答ファイル（PDF・画像）</p>
          {detail?.answer_key_attached && <LabelTag variant="info">アップロード済</LabelTag>}
        </div>

        <div className="flex gap-2 items-center">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 border border-dashed border-sky-400/30 rounded-sm cursor-pointer hover:border-sky-400 text-sm text-slate-400">
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)} />
            {keyFile ? keyFile.name : "解答ファイルを選択（PDF・画像）"}
          </label>
          <Button onClick={() => uploadKey()} disabled={!keyFile || uploadingKey}>
            {uploadingKey ? "送信中..." : "アップロード"}
          </Button>
        </div>
      </div>

      {/* 問題設定（問番号 + 配点のみ） */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-blue-300 text-sm font-semibold">配点設定</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">問題数:</span>
            <input
              type="number"
              min={1}
              max={200}
              value={countInput}
              onChange={(e) => {
                setCountInput(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (n >= 1 && n <= 200) {
                  const pts = distributePoints(n);
                  setRows(Array.from({ length: n }, (_, i) => ({
                    number: i + 1, question_text: "", model_answer: "", points: pts[i],
                  })));
                }
              }}
              onBlur={() => setCountInput(String(rows.length))}
              className="w-20 px-2 py-1 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm text-center outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-sky-400/20 rounded-sm">
            <span className="text-xs font-bold text-sky-400 w-8 shrink-0">問 {i + 1}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={1}
                value={row.points}
                onChange={(e) => updateRow(i, "points", Number(e.target.value))}
                className="w-14 px-2 py-1.5 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm text-right outline-none focus:border-sky-400"
              />
              <span className="text-slate-400 text-xs">点</span>
            </div>
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-xs text-red-400 hover:text-red-300 shrink-0">削除</button>
            )}
          </div>
        ))}

        <button
          onClick={addRow}
          className="w-full py-2 border border-dashed border-sky-400/30 rounded-sm text-sky-400 text-sm hover:border-sky-400 hover:bg-sky-400/5 transition-all"
        >
          ＋ 問題を追加
        </button>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save()} disabled={saving} fullWidth>
          {saving ? "保存中..." : "保存して答案一覧へ"}
        </Button>
        <button onClick={onNext} className="px-4 py-2 text-sm text-slate-400 hover:text-sky-300 whitespace-nowrap">
          スキップ
        </button>
      </div>
    </div>
  );
}

// ─── 教師：タブ切り替え採点ビュー ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "scored")   return <span className="text-green-400 text-xs font-bold">✓</span>;
  if (status === "ocr_done") return <span className="text-amber-400 text-xs font-bold">⚠</span>;
  return <span className="text-slate-500 text-xs animate-pulse">⚙</span>;
}

function TeacherGradingView({ exam }: { exam: Exam }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [gradingKey, setGradingKey] = useState(0);

  const { data: sheets, isLoading, refetch } = useQuery({
    queryKey: ["answer_sheets", exam.id],
    queryFn: () => listAnswerSheets(exam.id),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return false;
      return d.some((s) => s.status === "pending") ? 3000 : false;
    },
  });

  // selectedId が未設定なら最初の答案をデフォルト選択とする
  const selectedSheet = sheets?.find((s) => s.id === selectedId) ?? sheets?.[0] ?? null;

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
    <div className="flex flex-col">
      {/* 生徒タブ */}
      <div className="flex items-center gap-0 border-b border-sky-400/20 overflow-x-auto">
        {sheets.map((s) => {
          const isActive = selectedSheet?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors duration-150 ${
                isActive
                  ? "border-sky-400 text-sky-200 font-semibold bg-sky-400/8"
                  : "border-transparent text-slate-400 hover:text-sky-300 hover:bg-white/3"
              }`}
            >
              {s.student_name}
              <StatusBadge status={s.status} />
            </button>
          );
        })}
        <button
          onClick={() => refetch()}
          className="ml-auto px-3 py-2 text-xs text-slate-500 hover:text-sky-300 shrink-0"
          title="更新"
        >
          ↻
        </button>
      </div>

      {/* 採点パネル */}
      {selectedSheet ? (
        <GradingStep
          key={`${selectedSheet.id}-${gradingKey}`}
          exam={exam}
          sheetSummary={selectedSheet}
          onDone={() => { void refetch(); setGradingKey((k) => k + 1); }}
        />
      ) : (
        <p className="text-center text-slate-400 py-10 text-sm">生徒を選択してください</p>
      )}
    </div>
  );
}

// ─── 教師：採点 ────────────────────────────────────────────────────────────────


function FileViewerInner({
  label,
  url,
  contentType,
  className,
}: {
  label: string;
  url: string;
  contentType: string | null;
  className?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    fetch(url, { credentials: "include" })
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      })
      .catch(() => { if (!cancelled) setFetchFailed(true); });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);

  if (fetchFailed) return (
    <div className={`flex flex-col gap-1 min-h-0 ${className ?? ""}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="flex-1 flex items-center justify-center border border-dashed border-red-400/20 rounded-sm min-h-[80px]">
        <p className="text-red-400 text-xs">読み込み失敗</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col gap-1 min-h-0 ${className ?? ""}`}>
      <p className="text-xs text-slate-400">{label}</p>
      {!objectUrl ? (
        <div className="flex-1 flex items-center justify-center border border-sky-400/20 rounded-sm min-h-[80px]">
          <p className="text-slate-400 text-xs animate-pulse">読み込み中...</p>
        </div>
      ) : contentType === "application/pdf" ? (
        <iframe src={objectUrl} className="flex-1 w-full min-h-0 rounded-sm border border-sky-400/30 bg-white" title={label} />
      ) : (
        <img src={objectUrl} alt={label} className="flex-1 w-full min-h-0 rounded-sm border border-sky-400/30 object-contain" />
      )}
    </div>
  );
}

function FileViewer({
  label,
  url,
  contentType,
  className,
}: {
  label: string;
  url: string | null;
  contentType: string | null;
  className?: string;
}) {
  if (!url) return (
    <div className={`flex flex-col gap-1 min-h-0 ${className ?? ""}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="flex-1 flex items-center justify-center border border-dashed border-sky-400/20 rounded-sm min-h-[80px]">
        <p className="text-slate-500 text-xs">未設定</p>
      </div>
    </div>
  );
  return <FileViewerInner key={url} label={label} url={url} contentType={contentType} className={className} />;
}

function GradingStep({
  exam,
  sheetSummary,
  onDone,
}: {
  exam: Exam;
  sheetSummary: AnswerSheetSummary;
  onDone: () => void;
}) {
  // correctness[questionId] = true(○) / false(×) / undefined(未判定)
  const [correctness, setCorrectness] = useState<Record<number, boolean>>({});
  // customPoints[questionId] = 教師が上書きした配点
  const [customPoints, setCustomPoints] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const queryKey = ["answer_sheet", exam.id, sheetSummary.id];

  const { data: sheet } = useQuery({
    queryKey,
    queryFn: () => getAnswerSheet(exam.id, sheetSummary.id),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return false;
      if (d.status === "pending") return 3000;
      if (d.ai_grading?.status === "processing") return 3000;
      return false;
    },
  });

  // AI採点結果が届いたら自動で○/×を入力（初回のみ）
  const aiApplied = useRef(false);
  useEffect(() => {
    if (
      aiApplied.current ||
      !sheet ||
      sheet.ai_grading?.status !== "done" ||
      sheet.questions.length === 0
    ) return;
    const results = (sheet.ai_grading as { status: "done"; results: Record<number, boolean> }).results;
    const correctnessById: Record<number, boolean> = {};
    sheet.questions.forEach((q) => {
      if (results[q.number] !== undefined) correctnessById[q.id] = results[q.number];
    });
    setCorrectness(correctnessById);
    aiApplied.current = true;
  }, [sheet]);

  const { mutate: regrade, isPending: regrading } = useMutation({
    mutationFn: () => regradeAnswerSheet(exam.id, sheetSummary.id),
    onSuccess: () => {
      aiApplied.current = false;
      setCorrectness({});
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => setError(e.message),
  });

  const getPoints = (q: ExamQuestion) => customPoints[q.id] ?? q.points;

  const totalMax = (sheet?.questions ?? []).reduce((s, q) => s + getPoints(q), 0);
  const totalScore = (sheet?.questions ?? []).reduce((s, q) => {
    return s + (correctness[q.id] === true ? getPoints(q) : 0);
  }, 0);

  const handleAutoScore = () => {
    if (sheet?.ai_grading?.status !== "done") return;
    const results = (sheet.ai_grading as { status: "done"; results: Record<number, boolean> }).results;
    const correctnessById: Record<number, boolean> = {};
    sheet.questions.forEach((q) => {
      if (results[q.number] !== undefined) correctnessById[q.id] = results[q.number];
    });
    setCorrectness(correctnessById);
    aiApplied.current = true;
  };

  const { mutate: score, isPending } = useMutation({
    mutationFn: () => submitScore(exam.id, sheetSummary.id, totalScore),
    onSuccess: () => { setFinalScore(totalScore); setSubmitted(true); },
    onError: (e: Error) => setError(e.message),
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <span className="text-5xl">✅</span>
        <p className="text-white font-bold text-lg">採点完了！</p>
        <p className="text-slate-400 text-sm">合計 {finalScore} / {totalMax} 点</p>
        <p className="text-xs text-slate-500 mt-1">生徒の成績に反映されました</p>
        <Button onClick={onDone}>答案一覧に戻る</Button>
      </div>
    );
  }

  if (!sheet) {
    return <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>;
  }

  const aiResults = sheet.ai_grading?.status === "done"
    ? (sheet.ai_grading as { status: "done"; results: Record<number, boolean> }).results
    : null;
  const aiCorrectCount = aiResults ? sheet.questions.filter((q) => aiResults[q.number] === true).length : null;

  return (
    <div className="grid grid-cols-[1fr_360px] gap-3 h-[calc(100vh-180px)]">

      {/* ─── 左: ファイル 2枚 上下 ─── */}
      <div className="flex flex-col gap-2 min-h-0">
        <FileViewer label="模範解答" url={sheet.answer_key_url} contentType={sheet.answer_key_content_type} className="flex-1" />
        <FileViewer label="生徒の答案" url={sheet.image_url} contentType={sheet.image_content_type} className="flex-1" />
      </div>

      {/* ─── 右: 採点パネル ─── */}
      <div className="flex flex-col gap-2 min-h-0 overflow-hidden">

        {/* ヘッダー */}
        <div className="px-3 py-2 bg-sky-400/10 border border-sky-400/30 rounded-sm shrink-0">
          <p className="text-xs text-sky-400">{exam.title}</p>
          <p className="text-white font-bold">{sheetSummary.student_name}</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-500/15 border border-red-500/60 rounded-sm shrink-0">
            <LabelTag variant="error">エラー</LabelTag>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* AI ステータス + ボタン */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {sheet.ai_grading?.status === "processing" && <span className="text-yellow-300 animate-pulse">AI判定中...</span>}
            {sheet.ai_grading?.status === "failed" && <span className="text-red-400">AI判定失敗</span>}
            {aiCorrectCount !== null && <span className="text-green-400">AI: {aiCorrectCount}/{sheet.questions.length} 問正解</span>}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleAutoScore}
              disabled={sheet.ai_grading?.status !== "done"}
              className="text-xs px-2 py-1 bg-white/5 border border-sky-400/30 rounded-sm text-sky-300 hover:bg-sky-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >再判定</button>
            <button
              onClick={() => regrade()}
              disabled={regrading || sheet.ai_grading?.status === "processing"}
              className="text-xs px-2 py-1 bg-white/5 border border-sky-400/30 rounded-sm text-sky-400 hover:bg-sky-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >{regrading ? "..." : "AI再採点"}</button>
          </div>
        </div>

        {/* 合計点 */}
        <div className="flex items-center justify-between px-3 py-2 bg-sky-400/10 border border-sky-400/40 rounded-sm shrink-0">
          <span className="text-blue-300 font-semibold text-sm">合計点</span>
          <span className="text-white font-black text-xl">{totalScore}<span className="text-slate-400 text-sm font-normal"> / {totalMax} 点</span></span>
        </div>

        {/* 問題リスト（スクロール） */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
          {sheet.questions.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-4">問題が未登録です。問題設定で問題数を設定してください。</p>
          ) : sheet.questions.map((q) => {
            const correct = correctness[q.id];
            const pts = getPoints(q);
            return (
              <div key={q.id} className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 border border-sky-400/20 rounded-sm">
                <span className="text-xs font-bold text-sky-400 w-6 shrink-0 text-center">{q.number}</span>
                <button
                  onClick={() => setCorrectness((p) => ({ ...p, [q.id]: true }))}
                  className={`w-8 h-8 rounded-sm text-base font-bold transition-all shrink-0 ${correct === true ? "bg-green-500/40 border-2 border-green-400 text-green-300" : "bg-white/5 border border-sky-400/20 text-slate-500 hover:border-green-400/50"}`}
                >○</button>
                <button
                  onClick={() => setCorrectness((p) => ({ ...p, [q.id]: false }))}
                  className={`w-8 h-8 rounded-sm text-base font-bold transition-all shrink-0 ${correct === false ? "bg-red-500/40 border-2 border-red-400 text-red-300" : "bg-white/5 border border-sky-400/20 text-slate-500 hover:border-red-400/50"}`}
                >×</button>
                <div className="flex items-center gap-0.5 ml-auto shrink-0">
                  <input
                    type="number"
                    min={0}
                    value={pts}
                    onChange={(e) => setCustomPoints((p) => ({ ...p, [q.id]: Number(e.target.value) }))}
                    className="w-9 px-1 py-0.5 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-xs text-right outline-none focus:border-sky-400"
                  />
                  <span className="text-slate-500 text-xs">点</span>
                </div>
                <span className={`text-xs font-bold w-6 text-right shrink-0 ${correct === true ? "text-green-300" : correct === false ? "text-red-400" : "text-slate-500"}`}>
                  {correct === true ? `+${pts}` : correct === false ? "0" : "-"}
                </span>
              </div>
            );
          })}
        </div>

        {/* 送信 */}
        <div className="shrink-0 flex flex-col gap-1">
          <Button
            onClick={() => score()}
            disabled={isPending || Object.keys(correctness).length < sheet.questions.length}
            fullWidth
          >
            {isPending ? "送信中..." : "採点を確定して生徒に通知"}
          </Button>
          {Object.keys(correctness).length < sheet.questions.length && (
            <p className="text-xs text-slate-500 text-center">全問題に ○/× を付けてください</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SubmitScreen（メイン） ────────────────────────────────────────────────────

export function SubmitScreen() {
  const { user } = useCurrentUser();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [studentDone, setStudentDone] = useState(false);
  const [teacherStep, setTeacherStep] = useState<"questions" | "grading">("questions");

  const reset = useCallback(() => {
    setSelectedExam(null);
    setStudentDone(false);
    setTeacherStep("questions");
  }, []);

  if (!user) return null;

  const isTeacher = user.role === "teacher" || user.role === "school_admin";
  const title = navLabel(user.role, "/submit");

  const currentStep = () => {
    if (!selectedExam) return "exam";
    if (isTeacher)     return teacherStep;
    if (studentDone)   return "done";
    return "upload";
  };

  const stepLabel = () => {
    switch (currentStep()) {
      case "exam":      return "試験を選ぶ";
      case "upload":    return "答案をアップロード";
      case "done":      return "提出完了";
      case "questions": return "問題設定";
      case "grading":   return "採点";
    }
  };

  return (
    <Panel className={`mx-auto mt-4 ${isTeacher && teacherStep === "grading" ? "max-w-[98vw]" : "max-w-2xl"}`}>
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
        {selectedExam && isTeacher && (
          <>
            <span>›</span>
            <button
              onClick={() => setTeacherStep("questions")}
              className={currentStep() === "questions" ? "text-sky-300 font-semibold" : "hover:text-sky-300"}
            >
              問題設定
            </button>
            {teacherStep === "grading" && (
              <>
                <span>›</span>
                <span className="text-sky-300 font-semibold">採点</span>
              </>
            )}
          </>
        )}
        {selectedExam && !isTeacher && (
          <>
            <span>›</span>
            <button
              onClick={() => setStudentDone(false)}
              className={currentStep() === "upload" ? "text-sky-300 font-semibold" : "hover:text-sky-300"}
            >
              アップロード
            </button>
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

      <div className={isTeacher && teacherStep === "grading" ? "px-0 py-0" : "px-5 py-6"}>
        {currentStep() === "exam" && (
          <ExamSelector onSelect={setSelectedExam} />
        )}

        {/* 生徒フロー */}
        {currentStep() === "upload" && selectedExam && (
          <StudentUploadStep
            exam={selectedExam}
            onUploaded={() => setStudentDone(true)}
          />
        )}
        {currentStep() === "done" && (
          <StudentDoneStep onReset={reset} />
        )}

        {/* 教師フロー */}
        {currentStep() === "questions" && selectedExam && (
          <QuestionSetupStep
            exam={selectedExam}
            onNext={() => setTeacherStep("grading")}
          />
        )}
        {currentStep() === "grading" && selectedExam && (
          <TeacherGradingView exam={selectedExam} />
        )}
      </div>
    </Panel>
  );
}
