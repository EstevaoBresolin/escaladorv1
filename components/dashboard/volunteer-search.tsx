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
import { Badge } from "../ui/badge";

interface VolunteerProps {
  volunteers: Volunteer[];
  selectedVolunteerId?: string;
  onSelectVolunteer?: (volunteerId: string) => void;
  availabilityCountMap?: Record<string, number>;
  monthlyEventsCount?: number;
  eventCountMap?: Record<string, number>;
  showEventStats?: boolean;
}

export function VolunteerSearch({
  volunteers,
  selectedVolunteerId,
  onSelectVolunteer,
  availabilityCountMap = {},
  monthlyEventsCount = 0,
  eventCountMap = {},
  showEventStats = true,
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
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span>{v.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {v.email}
                        </span>
                      </div>
                      {showEventStats && (
                        <div className="flex items-center gap-2">
                          {monthlyEventsCount > 1 &&
                            availabilityCountMap[v.id] === 1 && (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                Só pode nesse dia
                              </Badge>
                            )}
                          <Badge variant="secondary" className="text-[10px]">
                            {eventCountMap[v.id] ?? 0} eventos
                          </Badge>
                        </div>
                      )}
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
