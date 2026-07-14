import RowDetail from "@/components/RowDetail";
import RowMissing from "@/components/RowMissing";
import { getSpaceBundles } from "@/lib/data";
import { isAdmin } from "@/lib/auth";
import { findRowDetail, detailSpaces } from "@/lib/detail";
import { rowPath } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function CurrentStateRowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bundles, admin] = await Promise.all([getSpaceBundles(), isAdmin()]);
  const detail = findRowDetail(bundles, "current", id);
  if (!detail) return <RowMissing mode="current" />;
  // 편집(공간 이동)용 컨텍스트는 admin 에게만 — 뷰어 페이로드에서 제외.
  const editCtx = admin
    ? detailSpaces(bundles, "current")
    : { spaces: undefined, nextSortBySpace: undefined };
  return (
    <RowDetail
      detail={detail}
      mode="current"
      path={rowPath("current", id)}
      isAdmin={admin}
      spaces={editCtx.spaces}
      nextSortBySpace={editCtx.nextSortBySpace}
    />
  );
}
