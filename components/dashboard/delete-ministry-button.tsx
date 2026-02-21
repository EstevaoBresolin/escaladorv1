"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dbQuery } from "@/lib/api/db-client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteMinistryButtonProps {
  ministryId: string;
  ministryName: string;
}

export function DeleteMinistryButton({
  ministryId,
  ministryName,
}: DeleteMinistryButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    await dbQuery({
      table: "ministries",
      action: "delete",
      filters: [{ field: "id", operator: "eq", value: ministryId }],
    });
    setLoading(false);
    setOpen(false);
    router.push("/dashboard/ministerios");
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="text-destructive focus:text-destructive"
      >
        Excluir
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ministério</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ministério &ldquo;{ministryName}
              &rdquo;? Esta ação não pode ser desfeita e todos os voluntários
              serão desvinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
