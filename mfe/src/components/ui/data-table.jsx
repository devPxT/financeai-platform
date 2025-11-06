import React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * DataTable sem hovers nas linhas.
 * Aplica classes customizadas para header/background.
 * Você pode ajustar o texto / cores conforme seu tema.
 */
export function DataTable({ columns, data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#1F1F21] bg-[#0F0E11]">
      <Table className="datatable">
        <TableHeader className="bg-[#1F1F21]">
          {table.getHeaderGroups().map((hg) => (
            <TableRow
              key={hg.id}
              className="hover:bg-transparent data-[state=selected]:bg-transparent"
            >
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-white font-semibold border-b border-[#1F1F21] py-3"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-transparent data-[state=selected]:bg-transparent"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="py-3 text-sm border-b border-[#1F1F21]"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                Sem transações
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}