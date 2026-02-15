"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"

interface MarkAllReadButtonProps {
  userId: string
}

export function MarkAllReadButton({ userId }: MarkAllReadButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleMarkAllRead() {
    setLoading(true)
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
    setLoading(false)
    window.location.reload()
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
  )
}
