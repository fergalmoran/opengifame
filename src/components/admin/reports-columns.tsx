"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {ColumnDef} from "@tanstack/react-table";
import {CheckCheck, ExternalLink} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {dismissReport} from "@/app/admin/actions";
import {formatDistanceToNow} from "date-fns";

export interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  reporterIp: string | null;
  reporterName: string | null;
  reviewed: boolean;
  createdAt: Date;
  imageSlug: string;
  imageTitle: string;
  imageUrl: string;
}

const REASON_LABELS: Record<string, {label: string; variant: "destructive" | "secondary" | "outline"}> = {
  csam:            {label: "CSAM",                   variant: "destructive"},
  non_consensual:  {label: "Non-consensual",          variant: "destructive"},
  violence:        {label: "Violence / gore",         variant: "destructive"},
  spam:            {label: "Spam / misleading",       variant: "secondary"},
  other:           {label: "Other",                   variant: "outline"},
};

function DismissCell({report}: {report: ReportRow}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (report.reviewed) {
    return <span className="text-xs text-muted-foreground">Reviewed</span>;
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      title="Mark as reviewed"
      className="text-muted-foreground hover:text-green-600 hover:bg-green-600/10"
      onClick={() => startTransition(async () => {
        await dismissReport(report.id);
        router.refresh();
      })}
    >
      <CheckCheck className="h-4 w-4"/>
    </Button>
  );
}

export const reportsColumns: ColumnDef<ReportRow>[] = [
  {
    id: "image",
    header: "Image",
    cell: ({row}) => {
      const {imageSlug, imageTitle, imageUrl} = row.original;
      return (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={imageTitle} className="h-10 w-10 rounded object-cover shrink-0"/>
          <a
            href={`/image/${imageSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm font-medium hover:underline max-w-[200px] truncate"
          >
            {imageTitle}
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground"/>
          </a>
        </div>
      );
    },
  },
  {
    id: "reason",
    header: "Reason",
    cell: ({row}) => {
      const def = REASON_LABELS[row.original.reason] ?? {label: row.original.reason, variant: "outline"};
      return <Badge variant={def.variant}>{def.label}</Badge>;
    },
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({row}) => (
      <span className="text-sm text-muted-foreground line-clamp-2 max-w-[240px]">
        {row.original.details ?? "—"}
      </span>
    ),
  },
  {
    id: "reporter",
    header: "Reporter",
    cell: ({row}) => (
      <div className="text-sm">
        <div className="font-medium">{row.original.reporterName ?? "Anonymous"}</div>
        <div className="text-xs text-muted-foreground font-mono">{row.original.reporterIp ?? "—"}</div>
      </div>
    ),
  },
  {
    id: "age",
    header: "Reported",
    cell: ({row}) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(row.original.createdAt, {addSuffix: true})}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({row}) => (
      <div className="flex justify-end">
        <DismissCell report={row.original}/>
      </div>
    ),
  },
];
