"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventCalendarProps {
  events: any[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function EventCalendar({
  events,
  selectedDate,
  onSelectDate,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!selectedDate) return;
    const selected = new Date(`${selectedDate}T12:00:00`);
    if (!Number.isNaN(selected.getTime())) {
      setCurrentDate(selected);
    }
  }, [selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (onSelectDate) {
      onSelectDate(todayStr);
    }
  };

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => {
      // Handle both string dates and Date objects
      const eventDate =
        typeof e.date === "string"
          ? e.date
          : new Date(e.date).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
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
            const dayEvents = day ? getEventsForDay(day) : [];
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] bg-card p-1 md:min-h-[100px]",
                  !day && "bg-muted/50",
                  day && isSelected(day) && "bg-primary/10",
                  day && "cursor-pointer hover:bg-muted/30",
                )}
                onClick={day ? () => handleDayClick(day) : undefined}
                role={day ? "button" : undefined}
                tabIndex={day ? 0 : undefined}
                onKeyDown={
                  day
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleDayClick(day);
                        }
                      }
                    : undefined
                }
              >
                {day && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(day);
                      }}
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm transition-colors",
                        isSelected(day)
                          ? "bg-primary text-primary-foreground font-semibold"
                          : isToday(day)
                            ? "bg-primary/20 text-primary font-semibold"
                            : "text-card-foreground hover:bg-muted",
                      )}
                    >
                      {day}
                    </button>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/dashboard/eventos/${event.id}`}
                                className="group flex items-center gap-1 rounded-md bg-primary px-1.5 py-1 text-[10px] font-medium text-primary-foreground transition-all hover:bg-primary/90 md:text-xs line-clamp-1"
                                title={event.title}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Calendar className="h-2.5 w-2.5 shrink-0 md:h-3 md:w-3" />
                                <span className="truncate">{event.title}</span>
                              </Link>
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
                      {dayEvents.length > 2 && (
                        <div className="rounded-md bg-muted px-1.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground md:text-xs">
                          +{dayEvents.length - 2} mais
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
