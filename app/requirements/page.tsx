import SpaceView from "@/components/SpaceView";
import { getSpaceBundles } from "@/lib/data";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const [bundles, admin] = await Promise.all([getSpaceBundles(), isAdmin()]);
  return (
    <SpaceView
      bundles={bundles}
      mode="requirement"
      isAdmin={admin}
      title="요구사항"
      subtitle="공간별 요구사항 명세입니다. 레퍼런스 사진은 클릭 시 전체화면으로 확대됩니다."
    />
  );
}
