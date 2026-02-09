"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnavailabilityData {
  date: string;
  periods: string[];
}

interface EventData {
  date: string;
  title: string;
  start_time?: string;
}

interface AvailabilityCalendarProps {
  unavailabilities: UnavailabilityData[];
  events: EventData[];
  selectedDate?: string;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  onSelectDate?: (date: string) => void;
}

export function AvailabilityCalendar({
  unavailabilities,
  events,
  selectedDate,
  currentMonth: externalCurrentMonth,
  onMonthChange,
  onSelectDate,
}: AvailabilityCalendarProps) {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  
  const currentDate = externalCurrentMonth || internalCurrentDate;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalCurrentDate(newDate);
    }
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    if (onMonthChange) {
      onMonthChange(today);
    } else {
      setInternalCurrentDate(today);
    }
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (onSelectDate) {
      onSelectDate(todayStr);
    }
  };

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const getUnavailabilityForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return unavailabilities.find((u) => u.date === dateStr);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === selectedDate;
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (onSelectDate) {
      onSelectDate(dateStr);
    }
  };

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="capitalize">{monthName}</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border overflow-hidden">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const unavailability = day ? getUnavailabilityForDay(day) : null;
            const dayEvents = day ? getEventsForDay(day) : [];
            const hasUnavailability = !!unavailability;

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] bg-card p-1 md:min-h-[100px] cursor-pointer transition-colors",
                  !day && "bg-muted/50 cursor-default",
                  day && isSelected(day) && "bg-primary/10",
                  day && hasUnavailability && "bg-destructive/5",
                )}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <div
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm transition-colors",
                        isSelected(day)
                          ? "bg-primary text-primary-foreground font-semibold"
                          : isToday(day)
                            ? "bg-primary/20 text-primary font-semibold"
                            : hasUnavailability
                              ? "bg-destructive text-destructive-foreground font-semibold"
                              : "text-card-foreground hover:bg-muted",
                      )}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {hasUnavailability &&
                        (() => {
                          const isAllDay =
                            unavailability.periods.includes("all_day");
                          const periodLabels = unavailability.periods
                            .filter((p) => p !== "all_day")
                            .map((p) =>
                              p === "morning"
                                ? "Manhã"
                                : p === "afternoon"
                                  ? "Tarde"
                                  : "Noite",
                            );

                          const displayText = isAllDay
                            ? "Indisponível"
                            : `Indisponível (${periodLabels.join(", ")})`;

                          const tooltipPeriods = unavailability.periods
                            .map((p) =>
                              p === "all_day"
                                ? "Dia todo"
                                : p === "morning"
                                  ? "Manhã"
                                  : p === "afternoon"
                                    ? "Tarde"
                                    : "Noite",
                            )
                            .join(", ");

                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 rounded-md bg-destructive px-1.5 py-1 text-[10px] font-medium text-destructive-foreground md:text-xs line-clamp-1">
                                    <CalendarOff className="h-2.5 w-2.5 shrink-0 md:h-3 md:w-3" />
                                    <span className="truncate">
                                      {displayText}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-[200px]"
                                >
                                  <p className="font-medium">Indisponível</p>
                                  <p className="text-xs text-muted-foreground">
                                    {tooltipPeriods}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                      {dayEvents
                        .slice(0, hasUnavailability ? 1 : 2)
                        .map((event) => (
                          <TooltipProvider key={event.title}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 rounded-md bg-primary px-1.5 py-1 text-[10px] font-medium text-primary-foreground md:text-xs line-clamp-1">
                                  <CalendarIcon className="h-2.5 w-2.5 shrink-0 md:h-3 md:w-3" />
                                  <span className="truncate">
                                    {event.title}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[200px]"
                              >
                                <p className="font-medium">{event.title}</p>
                                {event.start_time && (
                                  <p className="text-xs text-muted-foreground">
                                    {event.start_time.slice(0, 5)}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      {dayEvents.length > (hasUnavailability ? 1 : 2) && (
                        <div className="rounded-md bg-muted px-1.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground md:text-xs">
                          +{dayEvents.length - (hasUnavailability ? 1 : 2)} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
