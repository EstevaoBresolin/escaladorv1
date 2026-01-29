"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Loader2, Building2 } from "lucide-react"
import { ReminderManager } from "@/components/dashboard/reminder-manager"

export default function ConfiguracoesPage() {
  const [churchName, setChurchName] = useState("")
  const [churchId, setChurchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id, churches(*)")
        .eq("id", user.id)
        .single()

      if (profile?.churches) {
        setChurchId(profile.church_id)
        setChurchName((profile.churches as { name: string }).name || "")
      }
    }

    loadSettings()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (!churchId) {
      setError("Igreja não encontrada.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from("churches")
      .update({ name: churchName })
      .eq("id", churchId)

    if (updateError) {
      setError("Erro ao atualizar configurações. Tente novamente.")
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua igreja
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Igreja
            </CardTitle>
            <CardDescription>
              Informações básicas da sua igreja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600">
                  Configurações salvas com sucesso!
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="churchName">Nome da Igreja</Label>
                <Input
                  id="churchName"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <ReminderManager />

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Excluir Conta
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Entre em contato com o suporte para excluir sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
