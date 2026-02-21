import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EditarVoluntarioLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-52 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>

      <Card>
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
