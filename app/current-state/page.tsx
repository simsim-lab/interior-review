import SpaceView from "@/components/SpaceView";
import { getSpaceBundles } from "@/lib/data";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CurrentStatePage() {
  const [bundles, admin] = await Promise.all([getSpaceBundles(), isAdmin()]);
  return (
    <SpaceView
      bundles={bundles}
      mode="current"
      isAdmin={admin}
      title="현재상태"
      subtitle="공간별 현재 상태와 사진입니다. 사진을 클릭하면 전체화면으로 확대해 볼 수 있습니다."
    />
  );
}
