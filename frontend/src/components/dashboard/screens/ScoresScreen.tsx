"use client";

import { useQuery } from "@tanstack/react-query";
import { Panel, LabelTag } from "@/components/ui";
import { getMyScores } from "@/lib/api/grading";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

const SUBJECT_LABEL: Record<string, string> = {
  english: "英語",
  math: "数学",
  physics: "物理",
  chemistry: "化学",
  biology: "生物",
  earth_science: "地学",
  geography: "地理",
  japanese_history: "日本史",
  world_history: "世界史",
  civics: "公民",
  japanese: "国語",
};

export function ScoresScreen() {
  const { user } = useCurrentUser();
  const { data, isLoading } = useQuery({
    queryKey: ["my_scores"],
    queryFn: getMyScores,
    enabled: user?.role === "student",
  });

  if (user?.role !== "student") {
    return (
      <Panel className="mx-auto mt-6 max-w-2xl">
        <div className="px-5 py-4 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5">
          <h1 className="text-xl font-black text-white">成績・召喚獣ステータス</h1>
        </div>
        <div className="px-5 py-10 text-center text-slate-400 text-sm">
          この画面は生徒のみ利用できます
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mx-auto mt-6 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
        <LabelTag variant="info">成績</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
          成績・召喚獣ステータス
        </h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-4">
        {isLoading && (
          <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-slate-400 text-sm">まだ採点された試験がありません</p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.map((s) => {
              const pct = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
              const color = pct >= 80 ? "text-green-300" : pct >= 60 ? "text-yellow-300" : "text-red-400";
              return (
                <div key={s.exam_id} className="px-5 py-4 bg-white/5 border border-sky-400/20 rounded-sm flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-white font-bold">{s.exam_title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {SUBJECT_LABEL[s.subject] ?? s.subject} ·{" "}
                      {new Date(s.scored_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-2xl font-black ${color}`}>{s.score}</span>
                    <span className="text-slate-400 text-sm"> / {s.max_score}</span>
                    <p className={`text-xs font-bold ${color}`}>{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}
