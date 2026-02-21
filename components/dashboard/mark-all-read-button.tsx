"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dbQuery } from "@/lib/api/db-client";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

interface MarkAllReadButtonProps {
  userId: string;
}

export function MarkAllReadButton({ userId }: MarkAllReadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMarkAllRead() {
    setLoading(true);
    await dbQuery({
      table: "notifications",
      action: "update",
      values: { is_read: true },
      filters: [
        { field: "user_id", operator: "eq", value: userId },
        { field: "is_read", operator: "eq", value: false },
      ],
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleMarkAllRead} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Marcando...
        </>
      ) : (
        <>
          <Check className="mr-2 h-4 w-4" />
          Marcar todas como lidas
        </>
      )}
    </Button>
  );
}
