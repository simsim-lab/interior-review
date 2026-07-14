import RowDetail from "@/components/RowDetail";
import RowMissing from "@/components/RowMissing";
import { getSpaceBundles } from "@/lib/data";
import { isAdmin } from "@/lib/auth";
import { findRowDetail, detailSpaces } from "@/lib/detail";
import { rowPath } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function RequirementRowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bundles, admin] = await Promise.all([getSpaceBundles(), isAdmin()]);
  const detail = findRowDetail(bundles, "requirement", id);
  if (!detail) return <RowMissing mode="requirement" />;
  // 편집(공간 이동)용 컨텍스트는 admin 에게만 — 뷰어 페이로드에서 제외.
  const editCtx = admin
    ? detailSpaces(bundles, "requirement")
    : { spaces: undefined, nextSortBySpace: undefined };
  return (
    <RowDetail
      detail={detail}
      mode="requirement"
      path={rowPath("requirement", id)}
      isAdmin={admin}
      spaces={editCtx.spaces}
      nextSortBySpace={editCtx.nextSortBySpace}
    />
  );
}
