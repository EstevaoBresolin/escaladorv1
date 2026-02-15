"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Users, MoreVertical, Church, Search } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteMinistryButton } from "@/components/dashboard/delete-ministry-button"
import { getUserPermissions } from "@/lib/permissions"

interface Ministry {
  id: string
  name: string
  description?: string
  color: string
  user_ministries?: { count: number }[]
}

export default function MinisteriosPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [memberMinistryIds, setMemberMinistryIds] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLeader, setIsLeader] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single()

      // Get user permissions
      const permissions = await getUserPermissions(supabase);
      setIsAdmin(permissions?.isAdmin || false);
      setIsLeader(permissions?.isLeader || false);

      const { data: ministriesData } = await supabase
        .from("ministries")
        .select(`
          *,
          user_ministries(count)
        `)
        .eq("church_id", profile?.church_id)
        .order("name")

      const { data: userMinistries } = await supabase
        .from("user_ministries")
        .select("ministry_id")
        .eq("user_id", user.id)

      setMinistries(ministriesData || [])
      setMemberMinistryIds(new Set(
        (userMinistries || []).map((m: { ministry_id: string }) => m.ministry_id),
      ))
      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredMinistries = useMemo(() => {
    if (!searchTerm.trim()) return ministries

    const term = searchTerm.toLowerCase().trim()
    return ministries.filter((ministry) =>
      ministry.name.toLowerCase().includes(term) ||
      (ministry.description && ministry.description.toLowerCase().includes(term))
    )
  }, [ministries, searchTerm])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ministérios</h1>
            <p className="text-muted-foreground">
              Gerencie os ministérios da sua igreja
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ministérios</h1>
          <p className="text-muted-foreground">
            Gerencie os ministérios da sua igreja
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/ministerios/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Ministério
            </Link>
          </Button>
        )}
      </div>

      {ministries && ministries.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar ministérios pelo nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {filteredMinistries && filteredMinistries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMinistries.map((ministry) => (
            <Card key={ministry.id} className="relative">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${ministry.color}20`,
                      color: ministry.color,
                    }}
                  >
                    <Church className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{ministry.name}</CardTitle>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(isAdmin || isLeader || memberMinistryIds.has(ministry.id)) && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/ministerios/${ministry.id}`}>
                          Ver detalhes
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/ministerios/${ministry.id}/editar`}>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DeleteMinistryButton ministryId={ministry.id} ministryName={ministry.name} />
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {ministry.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {ministry.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {ministry.user_ministries?.[0]?.count || 0} voluntários
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ministries && ministries.length > 0 && searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Nenhum ministério encontrado
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              Não encontramos nenhum ministério com o termo "{searchTerm}".
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Limpar pesquisa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Church className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Nenhum ministério cadastrado
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {isAdmin 
                ? "Comece criando o primeiro ministério da sua igreja."
                : "Nenhum ministério disponível no momento."}
            </p>
            {isAdmin && (
              <Button asChild>
                <Link href="/dashboard/ministerios/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Ministério
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
