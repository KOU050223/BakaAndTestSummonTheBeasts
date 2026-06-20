"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import type { Role, User } from "@/lib/api/types";
import { extractApiError, extractServerErrors, extractFormErrorMessage } from "@/lib/api/errors";
import { Panel, LabelTag, Button } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/dashboard/navigation";
import { UserFormModal, type UserFormValues } from "./UserFormModal";

// ロールバッジの配色。
const roleBadgeClass: Record<Role, string> = {
  student: "bg-amber-100 border border-amber-800/40 text-amber-950",
  teacher: "bg-orange-100 border border-orange-800/40 text-orange-950",
  school_admin: "bg-rose-100 border border-rose-800/40 text-rose-950",
};

// 絞り込みフィルタ（"all" は全件）。
type RoleFilter = Role | "all";
const FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "全員" },
  { value: "student", label: "生徒" },
  { value: "teacher", label: "教師" },
  { value: "school_admin", label: "管理者" },
];

function StatCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <Panel className="flex-1">
      <div className="px-5 py-4">
        <p className="text-xs font-bold tracking-wide text-[var(--dashboard-muted)]">{label}</p>
        <p className={`my-1 text-4xl font-black ${accent}`}>{value}</p>
        <p className="text-xs text-[var(--dashboard-muted)]">{sub}</p>
      </div>
    </Panel>
  );
}

export function UserManagementScreen({
  selectable,
  onSelect,
  initialFilter = "all",
}: {
  selectable?: boolean;
  onSelect?: (user: User) => void;
  initialFilter?: RoleFilter;
}) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RoleFilter>(initialFilter);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 一覧はクライアント側で検索・フィルタするため常に全件取得する。
  const { data, isLoading, isError } = $api.useQuery("get", "/api/admin/users");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["get", "/api/admin/users"] });
  };

  const createMutation = $api.useMutation("post", "/api/admin/users", {
    onSuccess() {
      invalidate();
      closeModal();
    },
  });
  const updateMutation = $api.useMutation("patch", "/api/admin/users/{id}", {
    onSuccess() {
      invalidate();
      closeModal();
    },
  });
  const deleteMutation = $api.useMutation("delete", "/api/admin/users/{id}", {
    onSuccess: invalidate,
  });

  const stats = data?.stats;

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (data?.users ?? []).filter((user) => {
      if (filter !== "all" && user.role !== filter) return false;
      if (!keyword) return true;
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [data?.users, filter, search]);

  const openCreate = () => {
    setEditingUser(null);
    createMutation.reset();
    setModalOpen(true);
  };
  const openEdit = (user: User) => {
    setEditingUser(user);
    updateMutation.reset();
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (values: UserFormValues) => {
    if (editingUser) {
      // 編集時はパスワード空欄なら送らない（サーバー側で据え置き）。
      const body = {
        name: values.name,
        email: values.email,
        role: values.role,
        ...(values.password ? { password: values.password } : {}),
      };
      updateMutation.mutate({ params: { path: { id: editingUser.id } }, body });
    } else {
      createMutation.mutate({ body: values });
    }
  };

  const handleDelete = (user: User) => {
    if (!window.confirm(`${user.name} を削除しますか？この操作は取り消せません。`)) return;
    deleteMutation.mutate({ params: { path: { id: user.id } } });
  };

  const activeMutation = editingUser ? updateMutation : createMutation;

  return (
    <div className="user-management-screen mx-auto flex max-w-6xl flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white">
            ユーザー管理
          </h1>
          <p className="mt-1 text-sm text-[var(--dashboard-muted)]">生徒・教師アカウントの登録・編集・削除</p>
        </div>
        <Button onClick={openCreate}>＋追加</Button>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="flex flex-wrap gap-4">
          <StatCard label="生徒アカウント" value={stats.student_count} sub="A〜Fクラス合計" accent="text-sky-800" />
          <StatCard label="教師アカウント" value={stats.teacher_count} sub="各クラス担任" accent="text-violet-800" />
          <StatCard label="管理者アカウント" value={stats.admin_count} sub="システム管理者" accent="text-amber-800" />
          <StatCard label="総ユーザー数" value={stats.total_count} sub="全アカウント" accent="text-emerald-800" />
        </div>
      )}

      {/* 検索・フィルタ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 名前・メールで検索…"
          className="w-full max-w-md flex-1 rounded-sm border border-[var(--dashboard-border)] bg-white/75 px-4 py-2.5 text-sm text-[var(--dashboard-text)] outline-none transition-all placeholder:text-[var(--dashboard-muted)] focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)]"
        />
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-sm text-sm font-bold tracking-wide transition-colors ${
                filter === opt.value
                  ? "border border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white"
                  : "border border-[var(--dashboard-border)] bg-white/55 text-[var(--dashboard-text)] hover:bg-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 一覧テーブル */}
      <Panel>
        {isLoading ? (
          <p className="animate-pulse px-5 py-10 text-center text-[var(--dashboard-accent)]">読み込み中...</p>
        ) : isError ? (
          <p className="px-5 py-10 text-center text-red-800">ユーザー一覧の取得に失敗しました。</p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-5 py-10 text-center text-[var(--dashboard-muted)]">該当するユーザーがいません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--dashboard-border)] bg-[var(--dashboard-table-header-bg)] text-xs uppercase tracking-wider text-[var(--dashboard-table-header-text)]">
                  <th className="px-5 py-3 font-semibold">氏名</th>
                  <th className="px-5 py-3 font-semibold">メールアドレス</th>
                  <th className="px-5 py-3 font-semibold">ロール</th>
                  <th className="px-5 py-3 font-semibold">クラス</th>
                  <th className="px-5 py-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-[var(--dashboard-border)]/20 transition-colors ${selectable ? "cursor-pointer hover:bg-white/55" : "hover:bg-white/40"}`}
                    onClick={selectable ? () => onSelect?.(user) : undefined}
                  >
                    <td className="px-5 py-3 font-bold text-[var(--dashboard-text)]">{user.name}</td>
                    <td className="px-5 py-3 font-mono text-[var(--dashboard-muted)]">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-sm px-2.5 py-0.5 text-[0.7rem] font-bold tracking-wide ${roleBadgeClass[user.role]}`}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--dashboard-text)]">{user.school_class?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      {!selectable ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="rounded-sm border border-[var(--dashboard-border)] bg-white/60 px-3 py-1 text-xs font-bold text-[var(--dashboard-text)] transition-colors hover:bg-white"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={deleteMutation.isPending}
                            className="rounded-sm border border-red-700/50 bg-red-50 px-3 py-1 text-xs font-bold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            削除
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-sm text-[var(--dashboard-muted)]">選択</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {deleteMutation.isError && (
        <div className="flex items-center gap-2 rounded-sm border border-red-500/60 bg-red-500/15 px-4 py-3">
          <LabelTag variant="error">削除失敗</LabelTag>
          <p className="text-sm text-red-800">
            {extractApiError(deleteMutation.error)?.message ?? "削除に失敗しました。"}
          </p>
        </div>
      )}

      {modalOpen && (
        <UserFormModal
          user={editingUser}
          isSubmitting={activeMutation.isPending}
          serverErrors={extractServerErrors(activeMutation.error)}
          errorMessage={extractFormErrorMessage(activeMutation.error)}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
