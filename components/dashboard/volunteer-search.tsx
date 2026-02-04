import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Volunteer } from "./ministry-volunteer-manager";
import { useState } from "react";

interface VolunteerProps {
  volunteers: Volunteer[];
  selectedVolunteerId?: string;
  onSelectVolunteer?: (volunteerId: string) => void;
}

export function VolunteerSearch({
  volunteers,
  selectedVolunteerId,
  onSelectVolunteer,
}: VolunteerProps) {
  const [open, setOpen] = useState(false);

  const selectedVolunteerObj = volunteers.find(
    (v) => v.id === selectedVolunteerId,
  );

  function handleSelectVolunteer(value: string) {
    setOpen(false);
    onSelectVolunteer?.(value);
  }

  return (
    <div className="space-y-2">
      <Label>Voluntário *</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedVolunteerObj ? (
              <div className="flex flex-col items-start">
                <span>{selectedVolunteerObj.name}</span>
              </div>
            ) : (
              "Selecione um voluntário"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Procure um voluntário" />
            <CommandList>
              <CommandEmpty>Nenhum voluntário encontrado.</CommandEmpty>
              <CommandGroup heading="Voluntários Disponíveis">
                {volunteers.map((v) => (
                  <CommandItem
                    key={v.id}
                    value={v.name}
                    onSelect={() => handleSelectVolunteer(v.id)}
                  >
                    <div className="flex flex-col">
                      <span>{v.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
