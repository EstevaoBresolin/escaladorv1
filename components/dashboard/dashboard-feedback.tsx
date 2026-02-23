import type { ReactNode } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-background/70 p-8 text-center",
        className,
      )}
    >
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

interface DashboardErrorAlertProps {
  message: string;
  className?: string;
}

export function DashboardErrorAlert({
  message,
  className,
}: DashboardErrorAlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
