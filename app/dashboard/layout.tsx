import React from "react";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "../../components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "../../components/dashboard/dashboard-topbar";
import { DashboardLayoutClient } from "../../components/dashboard/dashboard-layout-client";
import {
  getCachedPermissions,
  getCachedProfile,
  getCachedUser,
} from "../../lib/supabase/cache";
import { PageTransition } from "../../components/ui/page-transition";

// Cache por 60 segundos para melhor performance
export const revalidate = 60;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getCachedProfile(user.id);
  const permissions = await getCachedPermissions(user.id);
  const requireProfileCompletion = !permissions?.isSuperAdmin;
  const canViewVolunteers =
    Boolean(permissions?.isAdmin) ||
    (permissions?.ledMinistryIds?.length || 0) > 0;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        profile={profile}
        canViewVolunteers={canViewVolunteers}
      />
      <div className="flex flex-1 flex-col bg-muted/30 lg:pl-72">
        <DashboardTopbar profile={profile} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <DashboardLayoutClient
              profilePhone={profile?.phone || undefined}
              profileChurchId={profile?.church_id || undefined}
              requireProfileCompletion={requireProfileCompletion}
            >
              <PageTransition>{children}</PageTransition>
            </DashboardLayoutClient>
          </div>
        </main>
      </div>
    </div>
  );
}
