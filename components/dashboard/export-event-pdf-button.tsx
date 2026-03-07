"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { generateEventPdf } from "@/lib/pdf-export";

interface Ministry {
  id: string;
  name: string;
  color: string;
}

interface ExportEventPdfButtonProps {
  event: any;
  manageableMinistries: Ministry[];
  volunteerSlots: any[];
}

export function ExportEventPdfButton({
  event,
  manageableMinistries,
  volunteerSlots,
}: ExportEventPdfButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState(
    manageableMinistries.length === 1 ? manageableMinistries[0]?.id : "",
  );

  function handleOpenDialog() {
    // Se só tem um ministério, exporta direto
    if (manageableMinistries.length === 1) {
      handleExportPdf();
    } else {
      // Caso contrário, abre o modal
      setOpen(true);
    }
  }

  function handleExportPdf() {
    const ministry =
      manageableMinistries.find((m) => m.id === selectedMinistryId) ||
      manageableMinistries[0];
    const slots = volunteerSlots.filter((slot: any) => {
      return !selectedMinistryId || slot.ministries?.id === selectedMinistryId;
    });
    generateEventPdf({ event, ministry, slots });
    setOpen(false);
  }

  if (manageableMinistries.length === 0) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpenDialog}>
        <Download className="mr-2 h-4 w-4" />
        Exportar PDF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar PDF do Evento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ministry">Selecione o ministério</Label>
              <Select
                value={selectedMinistryId}
                onValueChange={setSelectedMinistryId}
              >
                <SelectTrigger id="ministry">
                  <SelectValue placeholder="Selecione o ministério" />
                </SelectTrigger>
                <SelectContent>
                  {manageableMinistries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportPdf} disabled={!selectedMinistryId}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
