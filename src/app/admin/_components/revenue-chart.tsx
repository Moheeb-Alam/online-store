"use client";

import { useState } from "react";
import type { DailyPoint } from "@/lib/admin-data";
import { formatPrice } from "@/lib/config";
import { formatCompact, formatDayKey } from "@/lib/format";

/** Rounds the axis max up to a clean number and returns 5 evenly spaced ticks. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 250, 500, 750, 1000];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

/** Daily sales as columns: one series, per-bar hover/focus tooltip, table view below. */
export function RevenueChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.revenue)));
  const axisMax = ticks[ticks.length - 1];
  const labelEvery = Math.ceil(data.length / 7);
  const point = active !== null ? data[active] : null;

  return (
    <div>
      <div className="relative h-64 select-none" onMouseLeave={() => setActive(null)}>
        {/* Gridlines + y-axis labels */}
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute left-12 right-0 border-t border-slate-100"
            style={{ bottom: `${(tick / axisMax) * 100}%` }}
          >
            <span className="absolute -left-12 w-10 -translate-y-1/2 text-right text-[11px] text-slate-400 tabular-nums">
              {formatCompact(tick)}
            </span>
          </div>
        ))}

        {/* Columns */}
        <div className="absolute inset-0 left-12 flex items-end gap-[2px]">
          {data.map((d, i) => {
            const height = (d.revenue / axisMax) * 100;
            return (
              <button
                key={d.day}
                type="button"
                className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${formatDayKey(d.day)}: ${formatPrice(d.revenue)}, ${d.orders} orders`}
              >
                <span
                  className={`w-full max-w-6 rounded-t-[4px] transition-colors ${
                    active === i ? "bg-rose-500" : "bg-rose-600"
                  } group-focus-visible:ring-2 group-focus-visible:ring-rose-300`}
                  style={{ height: `${height}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* Hover line + tooltip */}
        {point && active !== null && (
          <>
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-slate-300"
              style={{ left: `calc(3rem + (100% - 3rem) * ${(active + 0.5) / data.length})` }}
            />
            <div
              className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg"
              style={{
                left: `calc(3rem + (100% - 3rem) * ${(active + 0.5) / data.length})`,
                transform: `translateX(${active > data.length / 2 ? "calc(-100% - 10px)" : "10px"})`,
              }}
            >
              <p className="text-[15px] font-bold text-slate-900 tabular-nums">{formatPrice(point.revenue)}</p>
              <p className="text-xs text-slate-500 tabular-nums">
                {point.orders} order{point.orders === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{formatDayKey(point.day)}</p>
            </div>
          </>
        )}
      </div>

      {/* X-axis labels */}
      {/* First and last labels always show (pinned to the edges); on small
          screens only the middle one joins them so labels never collide. */}
      <div className="ml-12 mt-2 flex h-4 gap-[2px]">
        {data.map((d, i) => {
          const last = data.length - 1;
          const middle = Math.floor(last / 2);
          const isEdge = i === 0 || i === last;
          const show = isEdge || i === middle || (i % labelEvery === 0 && last - i >= labelEvery / 2);
          const position =
            i === 0 ? "left-0" : i === last ? "right-0" : "left-1/2 -translate-x-1/2";
          const visibility = isEdge || i === middle ? "" : "hidden sm:block";
          return (
            <span key={d.day} className="relative min-w-0 flex-1">
              {show && (
                <span
                  className={`absolute top-0 whitespace-nowrap text-[11px] text-slate-400 ${position} ${visibility}`}
                >
                  {formatDayKey(d.day)}
                </span>
              )}
            </span>
          );
        })}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">
          View as table
        </summary>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-100">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-right font-semibold">Orders</th>
                <th className="px-3 py-2 text-right font-semibold">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {data.map((d) => (
                <tr key={d.day}>
                  <td className="px-3 py-1.5 text-slate-600">{formatDayKey(d.day)}</td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-900">{formatPrice(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
