"use client";

import type { ReactNode } from "react";

export interface OasisTableColumn<T = unknown> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  cellKey?: keyof T | string;
}

export interface OasisTableProps<T = Record<string, unknown>> {
  columns: OasisTableColumn<T>[];
  data: T[];
  className?: string;
}

export function OasisTable<T extends Record<string, unknown>>({
  columns,
  data,
  className = "",
}: OasisTableProps<T>) {
  return (
    <div className="oasis-table-wrap" data-oasis="table-wrap">
      <table className={`oasis-table ${className}`.trim()} data-oasis="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : (row[col.cellKey as keyof T] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
