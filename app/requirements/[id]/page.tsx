import RowDetail from "@/components/RowDetail";
import RowMissing from "@/components/RowMissing";
import { getSpaceBundles } from "@/lib/data";
import { findRowDetail } from "@/lib/detail";
import { rowPath } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function RequirementRowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundles = await getSpaceBundles();
  const detail = findRowDetail(bundles, "requirement", id);
  if (!detail) return <RowMissing mode="requirement" />;
  return (
    <RowDetail detail={detail} mode="requirement" path={rowPath("requirement", id)} />
  );
}
