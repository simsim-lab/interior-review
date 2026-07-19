import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getChecklistData } from "@/lib/data";
import ChecklistView from "@/components/ChecklistView";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  // admin 만 접근. 비로그인은 로그인 페이지로. (데이터 자체도 RLS 로 차단됨)
  if (!(await isAdmin())) {
    redirect("/login?next=/checklist");
  }
  const { vendors, items, answers } = await getChecklistData();
  return <ChecklistView vendors={vendors} items={items} answers={answers} />;
}
