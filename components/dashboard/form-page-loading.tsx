import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FormPageLoadingProps {
  titleWidth?: string;
}

export function FormPageLoading({ titleWidth = "w-52" }: FormPageLoadingProps) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className={`mt-2 h-8 rounded bg-muted ${titleWidth}`} />
        <div className="mt-2 h-4 w-72 rounded bg-muted" />
      </div>

      <Card className="max-w-3xl rounded-2xl">
        <CardHeader className="space-y-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-28 w-full rounded bg-muted" />
          <div className="h-10 w-40 rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
