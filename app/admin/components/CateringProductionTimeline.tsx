'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface CateringOrder {
  id: string;
  orderNumber: string;
  fulfillmentDate: string | null;
  status: string;
  totalQuantity: number;
  cateringType: string | null;
  cateringTypes?: string[];
  cateringTypeQuantities?: Record<string, number>;
}

const TYPES: Record<string, { bg: string; border: string; label: string; unit: string }> = {
  brunch:    { bg: '#E1F5EE', border: '#0F6E56', label: 'Brunch',    unit: 'portions' },
  lunch:     { bg: '#E6F1FB', border: '#185FA5', label: 'Lunch',     unit: 'people'   },
  dinatoire: { bg: '#EEEDFE', border: '#534AB7', label: 'Dînatoire', unit: 'pieces'   },
};
const TYPE_ORDER = ['brunch', 'lunch', 'dinatoire'] as const;
const MAX_QTY = 120;
const MAX_H = 52;
const MIN_H = 8;

// Parse YYYY-MM-DD as local date (avoids UTC off-by-one)
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtShort(d: Date) { return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }); }
function fmtFull(d: Date) { return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }); }

export default function CateringProductionTimeline({
  lightThreshold = 2,
  heavyThreshold = 4,
  onDateFilter,
}: {
  lightThreshold?: number;
  heavyThreshold?: number;
  onDateFilter?: (date: string | null) => void;
}) {
  const [orders, setOrders] = useState<CateringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const ttRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayKey = toKey(today);

  useEffect(() => {
    fetch('/api/orders?orderType=volume')
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 35-day window centred on today + weekOffset*7
  const days = useMemo(() => {
    const centre = addDays(today, weekOffset * 7);
    const start = addDays(centre, -17);
    return Array.from({ length: 35 }, (_, i) => addDays(start, i));
  }, [today, weekOffset]);

  const dayMap = useMemo(() => {
    const map: Record<string, Record<string, { orders: CateringOrder[]; qty: number }>> = {};
    const active = orders.filter(
      (o) => o.fulfillmentDate && o.status !== 'cancelled' && o.status !== 'fulfilled'
    );
    for (const o of active) {
      // Use local date to match how the table displays fulfillmentDate
      const fd = new Date(o.fulfillmentDate!);
      const k = toKey(fd);
      if (!map[k]) map[k] = {};
      const typeQtys = o.cateringTypeQuantities && Object.keys(o.cateringTypeQuantities).length
        ? o.cateringTypeQuantities
        : (() => {
            const types = o.cateringTypes?.length ? o.cateringTypes : (o.cateringType ? [o.cateringType] : ['other']);
            const q = Math.round(o.totalQuantity / types.length);
            return Object.fromEntries(types.map((t) => [t, q]));
          })();
      for (const [t, qty] of Object.entries(typeQtys)) {
        if (!map[k][t]) map[k][t] = { orders: [], qty: 0 };
        if (!map[k][t].orders.includes(o)) map[k][t].orders.push(o);
        map[k][t].qty += qty;
      }
    }
    return map;
  }, [orders]);

  const handleDayClick = (key: string, total: number) => {
    if (total === 0) return;
    const next = activeDay === key ? null : key;
    setActiveDay(next);
    onDateFilter?.(next);
  };

  const showTip = useCallback((e: React.MouseEvent<HTMLDivElement>, d: Date, data: Record<string, { orders: CateringOrder[]; qty: number }>, total: number) => {
    const tt = ttRef.current; if (!tt || total === 0) { if (tt) tt.style.display = 'none'; return; }
    let html = `<div style="font-weight:500;margin-bottom:6px">${fmtFull(d)}</div>`;
    for (const t of TYPE_ORDER) {
      const entry = data[t];
      if (!entry?.orders.length) continue;
      const cfg = TYPES[t];
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="width:8px;height:8px;border-radius:2px;background:${cfg.border};display:inline-block;flex-shrink:0"></span>
        <span style="color:#6B7280">${entry.orders.length} ${cfg.label} — <span style="color:#111">${entry.qty} ${cfg.unit}</span></span>
      </div>`;
    }
    html += `<div style="margin-top:6px;padding-top:6px;border-top:0.5px solid #E5E7EB;color:#9CA3AF;font-size:11px">Click to filter orders below</div>`;
    tt.innerHTML = html;
    tt.style.display = 'block';
    tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 200) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  }, []);

  const hideTip = useCallback(() => { const tt = ttRef.current; if (tt) tt.style.display = 'none'; }, []);
  const moveTip = useCallback((e: React.MouseEvent) => {
    const tt = ttRef.current; if (!tt || tt.style.display === 'none') return;
    tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 200) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  }, []);

  const clearFilter = () => { setActiveDay(null); onDateFilter?.(null); };

  if (loading) return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-24">
      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-400" />
    </div>
  );

  const hasOrders = orders.some((o) => o.fulfillmentDate && o.status !== 'cancelled' && o.status !== 'fulfilled');
  if (!hasOrders) return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-400 print:hidden">
      No upcoming orders.
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 print:hidden ct-wrap">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="px-2.5 py-1 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">← Week</button>
          <button onClick={() => { setWeekOffset(0); clearFilter(); }}
            className="px-2.5 py-1 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">Today</button>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="px-2.5 py-1 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">Week →</button>
          <span className="text-xs text-gray-400 ml-1">{fmtShort(days[0])} – {fmtShort(days[34])}</span>
        </div>
        <div className="flex items-center gap-3">
          {TYPE_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: TYPES[t].border }} />
              {TYPES[t].label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 py-3">
        <div className="flex gap-0.5">
          {days.map((d) => {
            const k = toKey(d);
            const data = dayMap[k] || {};
            const total = TYPE_ORDER.reduce((s, t) => s + (data[t]?.orders.length ?? 0), 0);
            const isToday = k === todayKey;
            const isActive = k === activeDay;
            const isSun = d.getDay() === 0;
            const isMonthStart = d.getDate() === 1;

            let dotColor: string | null = null;
            if (total >= heavyThreshold) dotColor = '#A32D2D';
            else if (total > lightThreshold) dotColor = '#BA7517';

            return (
              <div key={k}
                onClick={() => handleDayClick(k, total)}
                onMouseEnter={(e) => showTip(e, d, data, total)}
                onMouseMove={moveTip}
                onMouseLeave={hideTip}
                className={`flex-1 min-w-0 flex flex-col items-center rounded transition-colors px-px py-1 ${
                  total > 0 ? 'cursor-pointer' : ''
                } ${isActive ? 'bg-gray-100 outline outline-1 outline-gray-300' : isToday ? 'bg-blue-50' : 'hover:bg-gray-50'} ${
                  isSun ? 'opacity-35' : ''
                } ${isMonthStart ? 'border-l border-gray-200' : ''}`}
              >
                {/* Day letter */}
                <span className="text-[9px] text-gray-400 leading-none mb-0.5">
                  {d.toLocaleDateString('en-CA', { weekday: 'short' }).slice(0, 1)}
                </span>
                {/* Date number */}
                <span className={`text-[11px] leading-none mb-1 ${isToday ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {isMonthStart
                    ? d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }).replace(' ', '\u00A0')
                    : d.getDate()}
                </span>
                {/* Proportional bars */}
                <div className="flex flex-col gap-0.5 w-full items-center" style={{ minHeight: MAX_H }}>
                  {TYPE_ORDER.map((t) => {
                    const entry = data[t];
                    if (!entry?.orders.length) return null;
                    const h = Math.max(MIN_H, Math.round(MIN_H + (MAX_H - MIN_H) * (entry.qty / MAX_QTY)));
                    return (
                      <div key={t} style={{
                        width: '100%', maxWidth: 24, borderRadius: 3,
                        background: TYPES[t].bg, border: `0.5px solid ${TYPES[t].border}`,
                        height: h,
                      }} />
                    );
                  })}
                </div>
                {/* Total count */}
                {total > 0 && <span className="text-[10px] text-gray-400 mt-0.5">{total}</span>}
                {/* Load dot */}
                {dotColor && <span className="w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: dotColor }} />}
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="mt-2.5 min-h-[22px] flex items-center gap-2 text-xs">
          {activeDay ? (
            <>
              <span className="text-gray-400">Showing</span>
              <span className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5 text-gray-700">
                {fmtFull(parseLocalDate(activeDay))} — {
                  TYPE_ORDER.reduce((s, t) => s + ((dayMap[activeDay]?.[t]?.orders.length) ?? 0), 0)
                } order{TYPE_ORDER.reduce((s, t) => s + ((dayMap[activeDay]?.[t]?.orders.length) ?? 0), 0) > 1 ? 's' : ''}
                <button onClick={clearFilter} className="ml-1 text-gray-400 hover:text-gray-600 text-sm leading-none">×</button>
              </span>
            </>
          ) : (
            <span className="text-gray-400">Click a day to filter orders below</span>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <div ref={ttRef} style={{ position: 'fixed', display: 'none', zIndex: 99, pointerEvents: 'none', minWidth: 172 }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2.5 text-xs" />
    </div>
  );
}
