"use client";

import { useState } from "react";
import { dbQuery } from "@/lib/api/db-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface MinistryFunction {
  id: string;
  name: string;
}

interface MinistryFunctionManagerProps {
  ministryId: string;
  initialFunctions: MinistryFunction[];
  canManage: boolean;
}

export function MinistryFunctionManager({
  ministryId,
  initialFunctions,
  canManage,
}: MinistryFunctionManagerProps) {
  const [functions, setFunctions] = useState<MinistryFunction[]>(
    (initialFunctions || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddFunction(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Informe o nome da função.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await dbQuery<MinistryFunction>({
        table: "ministry_functions",
        action: "insert",
        values: { ministry_id: ministryId, name: trimmed },
        select: "id, name",
        single: true,
      });

      if (!data) {
        setError("Erro ao criar função. Tente novamente.");
        setLoading(false);
        return;
      }

      setFunctions((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setLoading(false);
    } catch {
      setError("Erro ao criar função. Tente novamente.");
      setLoading(false);
      return;
    }
  }

  async function handleDeleteFunction(functionId: string) {
    setLoading(true);
    setError(null);

    try {
      await dbQuery({
        table: "ministry_functions",
        action: "delete",
        filters: [{ field: "id", operator: "eq", value: functionId }],
      });
    } catch {
      setError("Erro ao remover função. Tente novamente.");
      setLoading(false);
      return;
    }

    setFunctions((prev) => prev.filter((f) => f.id !== functionId));
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <form onSubmit={handleAddFunction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="functionName">Nova função *</Label>
            <Input
              id="functionName"
              placeholder="Escreva o nome da função"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar função
              </>
            )}
          </Button>
        </form>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {functions.length > 0 ? (
        <div className="space-y-2">
          {functions.map((fn) => (
            <div
              key={fn.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="text-sm font-medium text-card-foreground">
                {fn.name}
              </span>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteFunction(fn.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remover função</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma função cadastrada para este ministério.
        </p>
      )}
    </div>
  );
}
