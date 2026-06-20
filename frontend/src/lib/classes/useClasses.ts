"use client";

import {
  useQueryClient,
  useQueries,
  type QueryClient,
} from "@tanstack/react-query";
import { $api, fetchClient } from "@/lib/api/client";
import type { ClassStudent } from "@/lib/api/types";

// クラスの所属変更後に、クラス一覧（平均・人数）と生徒一覧のキャッシュを
// 無効化して表示を最新化する。クラス変更・自動振り分けで共用する。
function invalidateClassData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["get", "/api/classes"] });
  queryClient.invalidateQueries({
    queryKey: ["get", "/api/classes/{class_id}/students"],
  });
}

// クラス一覧を取得する。学年を指定すると、その学年のクラスのみに絞り込む。
// staleTime を長めに取り、クラスカードの再描画でも余計なリクエストを飛ばさない。
export function useClasses(grade?: number) {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/classes",
    grade != null ? { params: { query: { grade } } } : {},
    {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );

  return {
    classes: data?.classes,
    gradeMaxTotalScore: data?.gradeMaxTotalScore ?? 0,
    gradeMaxScoreBySubject: data?.gradeMaxScoreBySubject ?? {},
    isLoading,
    isError,
    error,
  };
}

// 指定クラスの所属生徒一覧を取得する。classId が未指定の間はリクエストしない。
export function useClassStudents(classId: number | undefined) {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/classes/{class_id}/students",
    { params: { path: { class_id: classId ?? 0 } } },
    {
      enabled: classId != null,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );

  return { students: data?.students, isLoading, isError, error };
}

// 学年内の全クラスの生徒をまとめて取得する（自動振り分けの対象集合）。
// 既存のクラス単位 API をクラスごとに並列クエリし、結果を結合する。
// classId 付きで返すことで、現在の所属クラスを判別できる。
export type StudentWithClass = ClassStudent & { classId: number };

export function useGradeStudents(classIds: number[]) {
  const results = useQueries({
    queries: classIds.map((classId) => ({
      // $api.useQuery と同じキー形式に合わせ、invalidate の対象に含まれるようにする。
      queryKey: [
        "get",
        "/api/classes/{class_id}/students",
        { params: { path: { class_id: classId } } },
      ],
      queryFn: async () => {
        const { data, error } = await fetchClient.GET(
          "/api/classes/{class_id}/students",
          { params: { path: { class_id: classId } } },
        );
        if (error) throw error;
        return data;
      },
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const students: StudentWithClass[] = results.flatMap((r, i) =>
    (r.data?.students ?? []).map((s) => ({ ...s, classId: classIds[i] })),
  );

  return { students, isLoading };
}

// 生徒のクラスを変更する。成功時はクラス一覧（平均・人数）と
// 生徒一覧のキャッシュを無効化し、表示を最新の所属に追従させる。
export function useChangeStudentClass() {
  const queryClient = useQueryClient();

  const mutation = $api.useMutation("patch", "/api/students/{id}/class", {
    onSuccess: () => invalidateClassData(queryClient),
  });

  // studentId・classId（いずれも整数）を受け取り PATCH する薄いラッパ。
  const changeClass = (studentId: number, classId: number) =>
    mutation.mutate({
      params: { path: { id: studentId } },
      body: { class_id: classId },
    });

  return { changeClass, isPending: mutation.isPending, isError: mutation.isError };
}

// クラス振り分けを一括反映する（自動振り分けの保存）。
// {studentId, classId} の配列をバルク PATCH で送り、成功時にキャッシュを無効化する。
export function useApplyAssignments() {
  const queryClient = useQueryClient();

  const mutation = $api.useMutation("patch", "/api/classes/assignments", {
    onSuccess: () => invalidateClassData(queryClient),
  });

  const applyAssignments = (
    assignments: { studentId: number; classId: number }[],
  ) => mutation.mutate({ body: { assignments } });

  return {
    applyAssignments,
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
