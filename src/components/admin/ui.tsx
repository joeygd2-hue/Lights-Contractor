import type { Lead } from "@/db/schema";

export const STATUS_LABEL: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  quote_sent: "Quote sent",
  booked: "Booked",
  closed: "Closed",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-gold-soft/60 text-evergreen-950",
  contacted: "bg-evergreen-100 text-evergreen-900",
  quote_sent: "bg-evergreen-100 text-evergreen-900",
  booked: "bg-evergreen-800 text-ivory",
  closed: "bg-line text-ink-muted",
  confirmed: "bg-evergreen-800 text-ivory",
  cancelled: "bg-line text-ink-muted line-through",
  completed: "bg-evergreen-100 text-evergreen-900",
};

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-line"}`}>
      {label ?? STATUS_LABEL[status as Lead["status"]] ?? status}
    </span>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="text-4xl text-evergreen-900">{title}</h1>
      {children}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <p className="py-10 text-ink-muted" aria-busy="true">
      {label}
    </p>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-dashed border-line bg-paper p-10 text-center text-ink-muted">{children}</div>;
}

const tz = "America/Chicago";
export const fmtDateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
export const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(d);
export const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(d);
