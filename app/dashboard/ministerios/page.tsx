import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, MoreVertical, Church } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteMinistryButton } from "@/components/dashboard/delete-ministry-button"

export default async function MinisteriosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user?.id)
    .single()

  const { data: ministries } = await supabase
    .from("ministries")
    .select(`
      *,
      user_ministries(count)
    `)
    .eq("church_id", profile?.church_id)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ministérios</h1>
          <p className="text-muted-foreground">
            Gerencie os ministérios da sua igreja
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ministerios/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Ministério
          </Link>
        </Button>
      </div>

      {ministries && ministries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
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
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/ministerios/${ministry.id}`}>
                        Ver detalhes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/ministerios/${ministry.id}/editar`}>
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DeleteMinistryButton ministryId={ministry.id} ministryName={ministry.name} />
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
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Church className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Nenhum ministério cadastrado
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              Comece criando o primeiro ministério da sua igreja.
            </p>
            <Button asChild>
              <Link href="/dashboard/ministerios/novo">
                <Plus className="mr-2 h-4 w-4" />
                Criar Ministério
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
