"use client";

import {DataTable} from "@/components/admin/data-table";
import {reportsColumns, type ReportRow} from "@/components/admin/reports-columns";

export function ReportsTab({reports}: {reports: ReportRow[]}) {
  return <DataTable columns={reportsColumns} data={reports}/>;
}
