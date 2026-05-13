import { requireSuperAdminPage } from "@/lib/superadmin";
import { SuperadminManagementClient } from "@/components/dashboard/superadmin-management-client";

type ChurchOption = {
  id: string;
  name: string;
  plan: number | null;
  active: boolean | null;
};

export default async function SuperadminChurchManagementPage() {
  const { supabase } = await requireSuperAdminPage();

  const { data: churches } = await supabase
    .from("churches")
    .select("id, name, plan, active")
    .order("name");

  return (
    <SuperadminManagementClient
      initialChurches={((churches || []) as ChurchOption[]).map((church) => ({
        id: church.id,
        name: church.name,
        plan: church.plan ?? 0,
        active: church.active ?? true,
      }))}
    />
  );
}