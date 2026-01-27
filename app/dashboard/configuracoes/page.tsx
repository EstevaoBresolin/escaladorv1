"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Building2, MessageCircle, Clock } from "lucide-react"

export default function ConfiguracoesPage() {
  const [churchName, setChurchName] = useState("")
  const [churchId, setChurchId] = useState<string | null>(null)
  const [emailNotifications, setEmailNotifications] = useState(true)
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

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configure como você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba lembretes de escalas por email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Lembretes via WhatsApp
            </CardTitle>
            <CardDescription>
              Configure o envio automatico de lembretes para voluntarios escalados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Envio automatico</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Os lembretes sao enviados automaticamente todos os dias as 18h para 
                voluntarios escalados em eventos do dia seguinte.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Variaveis de ambiente necessarias:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">TWILIO_ACCOUNT_SID</code> - SID da sua conta Twilio</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">TWILIO_AUTH_TOKEN</code> - Token de autenticacao Twilio</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">TWILIO_WHATSAPP_FROM</code> - Numero do WhatsApp Twilio (ex: +14155238886)</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">CRON_SECRET</code> - Chave secreta para proteger o endpoint do cron</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Como configurar:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Crie uma conta no <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twilio</a></li>
                <li>Ative o WhatsApp Sandbox ou configure um numero aprovado</li>
                <li>Copie as credenciais e adicione nas variaveis de ambiente do Vercel</li>
                <li>Certifique-se de que os voluntarios tenham telefone cadastrado</li>
              </ol>
            </div>
          </CardContent>
        </Card>

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
