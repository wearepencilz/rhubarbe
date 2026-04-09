'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface TimelineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  fulfillmentDate: string | null;
  pickupDate: string | null;
  status: string;
  numberOfPeople: number | null;
  eventType: string | null;
  leadTimeDays: number | null;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function parseDate(s: string) {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmt(d: Date) {
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
}
function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const OVERFLOW = 7; // days of padding on each side
const PAD_L = 6;
const PAD_R = 16;
const TOP = 22;
const ROW_H = 14;
const DOT_R = 3;

interface PackedOrder extends TimelineOrder {
  row: number;
  leadTime: number;
}

function packRows(visible: (TimelineOrder & { leadTime: number })[]) {
  const rows: (TimelineOrder & { leadTime: number })[][] = [];
  const sorted = [...visible].sort(
    (a, b) => parseDate(a.fulfillmentDate!).getTime() - parseDate(b.fulfillmentDate!).getTime(),
  );
  for (const o of sorted) {
    const del = parseDate(o.fulfillmentDate!);
    const start = addDays(del, -o.leadTime);
    let placed = false;
    for (let r = 0; r < rows.length; r++) {
      const fits = rows[r].every((ex) => {
        const eDel = parseDate(ex.fulfillmentDate!);
        const eStart = addDays(eDel, -ex.leadTime);
        return del < eStart || start > eDel;
      });
      if (fits) { rows[r].push(o); placed = true; break; }
    }
    if (!placed) rows.push([o]);
  }
  const result: PackedOrder[] = [];
  rows.forEach((row, ri) => row.forEach((o) => result.push({ ...o, row: ri })));
  return { items: result, numRows: rows.length };
}

/** Get the first day of a month */
function monthStart(year: number, month: number) {
  return new Date(year, month, 1);
}
/** Get the last day of a month */
function monthEnd(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

export default function CakeProductionTimeline() {
  const svgRef = useRef<SVGSVGElement>(null);
  const ttRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [orders, setOrders] = useState<TimelineOrder[]>([]);
  const [defaultLeadTime, setDefaultLeadTime] = useState(7);
  const [maxCakes, setMaxCakes] = useState(7);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Track the displayed month (year, month index)
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    Promise.all([
      fetch('/api/orders?orderType=cake').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([ordersData, settings]) => {
        setOrders(ordersData);
        const cap = settings.cakeCapacity;
        if (cap) {
          if (typeof cap.leadTimeDays === 'number') setDefaultLeadTime(cap.leadTimeDays);
          if (typeof cap.maxCakes === 'number') setMaxCakes(cap.maxCakes);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute the day range: overflow before month + full month + overflow after
  const { days, monthStartIdx, monthEndIdx, totalDays } = useMemo(() => {
    const mStart = monthStart(viewYear, viewMonth);
    const mEnd = monthEnd(viewYear, viewMonth);
    const winStart = addDays(mStart, -OVERFLOW);
    const winEnd = addDays(mEnd, OVERFLOW);
    const total = Math.round((winEnd.getTime() - winStart.getTime()) / 86400000) + 1;
    const allDays = Array.from({ length: total }, (_, i) => addDays(winStart, i));
    const msIdx = allDays.findIndex((d) => d.getTime() === mStart.getTime());
    const meIdx = allDays.findIndex((d) => d.getTime() === mEnd.getTime());
    return { days: allDays, monthStartIdx: msIdx, monthEndIdx: meIdx, totalDays: total };
  }, [viewYear, viewMonth]);

  const winStart = days[0];
  const winEnd = days[totalDays - 1];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const showTip = useCallback((e: React.MouseEvent, o: PackedOrder, del: Date, prepStart: Date) => {
    const tt = ttRef.current;
    if (!tt) return;
    tt.innerHTML =
      `<div style="font-weight:500;margin-bottom:4px">${o.orderNumber}</div>` +
      `<div class="text-gray-500" style="margin-bottom:2px">${o.customerName}</div>` +
      (o.numberOfPeople ? `<div class="text-gray-500" style="margin-bottom:1px">${o.numberOfPeople} people · ${o.eventType || '—'}</div>` : '') +
      `<div class="text-gray-500" style="margin-bottom:1px">Delivery <span class="text-gray-900 font-medium">${fmt(del)}</span></div>` +
      `<div class="text-gray-500">Prep from <span class="text-gray-900 font-medium">${fmt(prepStart)}</span> (${o.leadTime}d)</div>`;
    tt.style.display = 'block';
    tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 220) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  }, []);

  const moveTip = useCallback((e: React.MouseEvent) => {
    const tt = ttRef.current;
    if (!tt) return;
    tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 220) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  }, []);

  const hideTip = useCallback(() => {
    const tt = ttRef.current;
    if (tt) tt.style.display = 'none';
  }, []);

  // Build visible orders
  const visible = useMemo(() => {
    return orders
      .filter((o) => (o.fulfillmentDate || o.pickupDate) && o.status !== 'cancelled' && o.status !== 'fulfilled')
      .map((o) => ({ ...o, fulfillmentDate: o.fulfillmentDate || o.pickupDate, leadTime: o.leadTimeDays || defaultLeadTime }))
      .filter((o) => {
        const del = parseDate(o.fulfillmentDate!);
        const start = addDays(del, -o.leadTime);
        return del >= winStart && start <= winEnd;
      });
  }, [orders, defaultLeadTime, winStart, winEnd]);

  const { items, numRows } = useMemo(() => packRows(visible), [visible]);

  // Daily load for capacity bar
  const dailyLoad = useMemo(() => {
    const load: Record<string, number> = {};
    for (const o of orders.filter((o) => (o.fulfillmentDate || o.pickupDate) && o.status !== 'cancelled' && o.status !== 'fulfilled')) {
      const del = parseDate((o.fulfillmentDate || o.pickupDate)!);
      const lt = o.leadTimeDays || defaultLeadTime;
      const start = addDays(del, -lt);
      for (let d = new Date(start); d <= del; d = addDays(d, 1)) {
        const k = toKey(d);
        load[k] = (load[k] || 0) + 1;
      }
    }
    return load;
  }, [orders, defaultLeadTime]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="h-20 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-400" />
        </div>
      </div>
    );
  }

  const svgW = 1200;
  const trackW = svgW - PAD_L - PAD_R;
  const dayW = trackW / totalDays;
  const capBarH = 6;
  const minRows = Math.max(numRows, 2);
  const H = TOP + minRows * ROW_H + 12 + capBarH + 8;

  function xOf(d: Date) {
    return PAD_L + ((d.getTime() - days[0].getTime()) / 86400000 / totalDays) * trackW;
  }

  const statusColors: Record<string, { line: string; dot: string }> = {
    confirmed: { line: '#B5D4F4', dot: '#185FA5' },
    pending: { line: '#FDE68A', dot: '#D97706' },
  };

  const todayIdx = (today.getTime() - days[0].getTime()) / 86400000;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Production Timeline</h3>
          <span className="text-[11px] text-gray-500 font-medium">{fmtMonth(new Date(viewYear, viewMonth))}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50">←</button>
          <button onClick={goToday} className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50">Today</button>
          <button onClick={nextMonth} className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50">→</button>
        </div>
      </div>

      <div className="px-2 py-2">
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${H}`} preserveAspectRatio="xMinYMin meet" style={{ width: '100%', display: 'block' }}>
          {/* Weekend bands */}
          {days.map((d, i) =>
            d.getDay() === 6 ? (
              <rect key={`we-${i}`} x={PAD_L + i * dayW} y={0} width={dayW * Math.min(2, totalDays - i)} height={H} fill="rgba(0,0,0,0.025)" />
            ) : null,
          )}

          {/* Today band */}
          {todayIdx >= 0 && todayIdx < totalDays && (
            <rect x={PAD_L + (todayIdx / totalDays) * trackW} y={0} width={dayW} height={H} fill="rgba(55,138,221,0.1)" />
          )}

          {/* Week dividers + labels */}
          {days.map((d, i) => {
            const els: React.ReactNode[] = [];
            if (i > 0 && d.getDay() === 1) {
              els.push(
                <line key={`wk-${i}`} x1={PAD_L + i * dayW} y1={0} x2={PAD_L + i * dayW} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />,
              );
            }
            if (d.getDay() === 1 || i === 0) {
              const isToday = toKey(d) === toKey(today);
              els.push(
                <text key={`lbl-${i}`} x={PAD_L + i * dayW + 3} y={12} fill={isToday ? '#185FA5' : 'rgba(0,0,0,0.25)'} fontSize={9}>
                  {fmt(d)}
                </text>,
              );
            }
            // Month boundary label
            if (d.getDate() === 1 && i > 0) {
              els.push(
                <line key={`mb-${i}`} x1={PAD_L + i * dayW} y1={0} x2={PAD_L + i * dayW} y2={H} stroke="rgba(0,0,0,0.12)" strokeWidth={0.5} strokeDasharray="2,2" />,
              );
            }
            return els;
          })}

          {/* Order lines */}
          {items.map((o) => {
            const del = parseDate(o.fulfillmentDate!);
            const prepStart = addDays(del, -o.leadTime);
            const y = TOP + o.row * ROW_H + ROW_H / 2;
            const x1 = Math.max(PAD_L, xOf(prepStart));
            const x2 = Math.min(PAD_L + trackW, xOf(del));
            const colors = statusColors[o.status] || statusColors.pending;

            return (
              <g key={o.id}>
                <line x1={x1} y1={y} x2={x2} y2={y} stroke={colors.line} strokeWidth={1.5} strokeLinecap="round" />
                <circle cx={x2} cy={y} r={DOT_R} fill={colors.dot} />
                <rect
                  x={x1 - 2} y={y - 8} width={x2 - x1 + 14} height={16}
                  fill="transparent" cursor="pointer"
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  onMouseEnter={(e) => showTip(e, o, del, prepStart)}
                  onMouseMove={moveTip}
                  onMouseLeave={hideTip}
                />
              </g>
            );
          })}

          {/* Capacity bar at bottom */}
          {days.map((d, i) => {
            const k = toKey(d);
            const count = dailyLoad[k] || 0;
            if (count === 0) return null;
            const barY = TOP + minRows * ROW_H + 6;
            const ratio = Math.min(count / maxCakes, 1);
            const fill = count >= maxCakes ? '#EF4444' : count >= maxCakes - 1 ? '#F59E0B' : '#D1D5DB';
            return (
              <rect key={`cap-${i}`} x={PAD_L + i * dayW + 1} y={barY} width={dayW - 2} height={capBarH} rx={1} fill={fill} opacity={0.7 + ratio * 0.3} />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#B5D4F4] rounded" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5]" />
          <span className="text-[10px] text-gray-400">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#FDE68A] rounded" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          <span className="text-[10px] text-gray-400">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-1 rounded-sm bg-[#D1D5DB]" />
          <span className="text-[10px] text-gray-400">Capacity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-1 rounded-sm bg-[#F59E0B]" />
          <span className="text-[10px] text-gray-400">Near limit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-1 rounded-sm bg-[#EF4444]" />
          <span className="text-[10px] text-gray-400">At capacity</span>
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={ttRef}
        style={{ position: 'fixed', display: 'none', zIndex: 999, pointerEvents: 'none', maxWidth: 220 }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs"
      />
    </div>
  );
}
