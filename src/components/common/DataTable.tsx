import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, i: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

/** Qayta ishlatiladigan jadval: sticky header, gorizontal scroll, qatorni ajratib ko‘rsatish. */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  highlight,
  maxHeight = 420,
  onRowClick,
  empty = 'Ma’lumot topilmadi',
  dense,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string | number;
  highlight?: (row: T, i: number) => string | undefined;
  maxHeight?: number | 'none';
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      className="scroll-thin overflow-auto rounded-xl border border-white/[0.07] bg-[#0c1426]"
      style={{ maxHeight: maxHeight === 'none' ? undefined : maxHeight }}
    >
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center font-sans text-muted">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, i) => {
            const hl = highlight?.(r, i);
            return (
              <tr
                key={rowKey(r, i)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${hl ?? 'hover:bg-white/[0.025]'}`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`${dense ? '!py-1.5' : ''} ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''} ${c.className ?? ''}`}
                  >
                    {c.render(r, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
