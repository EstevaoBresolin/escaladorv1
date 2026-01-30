import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profile is already complete, redirect to dashboard
  if (profile?.phone && profile?.church_id) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Complete seu perfil
          </h1>
          <p className="mt-2 text-muted-foreground">
            Precisamos de algumas informações para continuar
          </p>
        </div>

        <CompleteProfileForm
          initialPhone={profile?.phone || ""}
          initialChurchId={profile?.church_id || ""}
        />
      </div>
    </div>
  );
}
