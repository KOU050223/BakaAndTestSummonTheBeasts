"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Panel, LabelTag, Button } from "@/components/ui";
import { useClasses } from "@/lib/classes/useClasses";
import { createExam, createClass } from "@/lib/api/grading";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

const PRESET_SUBJECTS = [
  { code: "english", label: "英語" },
  { code: "math", label: "数学" },
  { code: "physics", label: "物理" },
  { code: "chemistry", label: "化学" },
  { code: "biology", label: "生物" },
  { code: "earth_science", label: "地学" },
  { code: "geography", label: "地理" },
  { code: "japanese_history", label: "日本史" },
  { code: "world_history", label: "世界史" },
  { code: "civics", label: "公民" },
  { code: "japanese", label: "国語" },
  { code: "informatics", label: "情報" },
  { code: "__custom__", label: "その他（手動入力）" },
] as const;

function ClassAddForm({ onAdded }: { onAdded: (c: { id: number; name: string; grade: number }) => void }) {
  const [grade, setGrade] = useState(2);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => createClass({ name, grade }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["get", "/api/classes"] });
      onAdded(data);
      setName("");
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="flex flex-col gap-2 px-3 py-3 bg-sky-400/5 border border-sky-400/20 rounded-sm">
      <p className="text-xs text-sky-400 font-semibold">新しいクラスを追加</p>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={6}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-12 px-2 py-1.5 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm text-center outline-none focus:border-sky-400"
          />
          <span className="text-slate-400 text-sm">年</span>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：Aクラス"
          className="flex-1 px-2 py-1.5 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm outline-none focus:border-sky-400 placeholder:text-slate-500"
        />
        <button
          onClick={() => mutate()}
          disabled={!name || isPending}
          className="px-3 py-1.5 text-xs bg-sky-400/20 border border-sky-400/40 rounded-sm text-sky-300 hover:bg-sky-400/30 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isPending ? "追加中..." : "追加"}
        </button>
      </div>
    </div>
  );
}

export function ExamCreateScreen() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subjectCode, setSubjectCode] = useState("math");
  const [customSubject, setCustomSubject] = useState("");
  const [classId, setClassId] = useState<number | "">("");
  const [maxScore, setMaxScore] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: number; title: string } | null>(null);
  const [showClassForm, setShowClassForm] = useState(false);

  const { classes, isLoading: classesLoading } = useClasses();

  const isCustomSubject = subjectCode === "__custom__";
  const subjectValue = isCustomSubject ? customSubject : subjectCode;

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      createExam({ title, subject: subjectValue, classId: classId as number, maxScore }),
    onSuccess: (data) => setCreated(data),
    onError: (e: Error) => setError(e.message),
  });

  if (userLoading) return null;

  if (user?.role === "student") {
    return (
      <Panel className="mx-auto mt-6 max-w-2xl">
        <div className="px-5 py-16 text-center">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-slate-400 text-sm">このページは教師専用です</p>
        </div>
      </Panel>
    );
  }

  if (created) {
    return (
      <Panel className="mx-auto mt-6 max-w-2xl">
        <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
          <LabelTag variant="info">試験設定</LabelTag>
          <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
            試験設定
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 px-5 py-12">
          <span className="text-5xl">✅</span>
          <p className="text-white font-bold text-lg">試験を作成しました</p>
          <p className="text-slate-400 text-sm">「{created.title}」</p>
          <div className="flex gap-3 mt-2">
            <Button onClick={() => router.push("/submit")}>AI自動採点へ進む</Button>
            <button
              onClick={() => {
                setCreated(null);
                setTitle("");
                setSubjectCode("math");
                setCustomSubject("");
                setClassId("");
                setMaxScore(100);
                setError(null);
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-sky-300"
            >
              続けて作成する
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mx-auto mt-6 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
        <LabelTag variant="info">試験設定</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
          試験設定
        </h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-500/15 border border-red-500/60 rounded-sm">
            <LabelTag variant="error">エラー</LabelTag>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* 試験名 */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <LabelTag variant="required">必須</LabelTag>
            <span className="text-blue-300 text-sm font-semibold">試験名</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：数学 小テスト1"
            className="px-3 py-2 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm outline-none focus:border-sky-400 placeholder:text-slate-500"
          />
        </div>

        {/* 科目 */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <LabelTag variant="required">必須</LabelTag>
            <span className="text-blue-300 text-sm font-semibold">科目</span>
          </label>
          <select
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-sky-400/30 rounded-sm text-sky-100 text-sm outline-none focus:border-sky-400"
          >
            {PRESET_SUBJECTS.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
          {isCustomSubject && (
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="科目名を入力"
              className="px-3 py-2 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm outline-none focus:border-sky-400 placeholder:text-slate-500"
            />
          )}
        </div>

        {/* 対象クラス */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <LabelTag variant="required">必須</LabelTag>
            <span className="text-blue-300 text-sm font-semibold">対象クラス</span>
          </label>
          {classesLoading ? (
            <p className="text-slate-400 text-sm animate-pulse">読み込み中...</p>
          ) : (
            <select
              value={classId}
              onChange={(e) => setClassId(Number(e.target.value))}
              className="px-3 py-2 bg-slate-800 border border-sky-400/30 rounded-sm text-sky-100 text-sm outline-none focus:border-sky-400"
            >
              <option value="">クラスを選択</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.grade}年{c.name}</option>
              ))}
            </select>
          )}
          {showClassForm ? (
            <ClassAddForm
              onAdded={(c) => {
                setClassId(c.id);
                setShowClassForm(false);
              }}
            />
          ) : (
            <button
              onClick={() => setShowClassForm(true)}
              className="self-start text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2"
            >
              ＋ 新しいクラスを追加する
            </button>
          )}
        </div>

        {/* 満点 */}
        <div className="flex flex-col gap-2">
          <label className="text-blue-300 text-sm font-semibold">満点</label>
          <input
            type="number"
            min={1}
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
            className="w-32 px-3 py-2 bg-white/5 border border-sky-400/30 rounded-sm text-sky-100 text-sm outline-none focus:border-sky-400"
          />
        </div>

        <Button
          onClick={() => create()}
          disabled={!title || !classId || (isCustomSubject && !customSubject) || isPending}
          fullWidth
        >
          {isPending ? "作成中..." : "試験を作成する"}
        </Button>
      </div>
    </Panel>
  );
}
