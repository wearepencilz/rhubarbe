'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/app/admin/components/ui/input';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import { DEFAULT_TOKENS, FONT_STACKS, TOKEN_CATEGORIES, type TypeToken } from '@/lib/design/tokens';

export default function DesignTypographyPage() {
  const toast = useToast();
  const [tokens, setTokens] = useState<TypeToken[]>(DEFAULT_TOKENS);
  const [fonts, setFonts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((data) => {
      if (data?.typographyTokens?.length) setTokens(data.typographyTokens);
      if (data?.fontStacks) setFonts(data.fontStacks);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateToken = (idx: number, patch: Partial<TypeToken>) => {
    setTokens((prev) => { const n = [...prev]; n[idx] = { ...n[idx], ...patch }; return n; });
  };
  const updateDesktop = (idx: number, patch: Partial<TypeToken['desktop']>) => {
    setTokens((prev) => { const n = [...prev]; n[idx] = { ...n[idx], desktop: { ...n[idx].desktop, ...patch } }; return n; });
  };
  const updateMobile = (idx: number, patch: Partial<TypeToken['mobile']>) => {
    setTokens((prev) => { const n = [...prev]; n[idx] = { ...n[idx], mobile: { ...n[idx].mobile, ...patch } }; return n; });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = await fetch('/api/settings').then((r) => r.json());
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, typographyTokens: tokens, fontStacks: fonts }),
      });
      if (res.ok) toast.success('Typography saved'); else toast.error('Failed');
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const filtered = filter === 'all' ? tokens : tokens.filter((t) => t.category === filter);

  if (loading) return <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="admin-narrow max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Typography System</h1>
          <p className="text-sm text-gray-500 mt-1">{tokens.length} tokens · Every text style across the entire site</p>
        </div>
        <Button color="primary" size="sm" onClick={handleSave} isDisabled={saving}>{saving ? 'Saving...' : 'Save all'}</Button>
      </div>

      {/* Font stacks */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Font Stacks</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(FONT_STACKS).map(([key, stack]) => (
            <Input key={key} label={stack.label} value={fonts[key] || ''} onChange={(v) => setFonts({ ...fonts, [key]: v })} placeholder={stack.default} />
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`text-xs px-3 py-1.5 rounded-full border ${filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-600 border-gray-300'}`}>All ({tokens.length})</button>
        {TOKEN_CATEGORIES.map((cat) => {
          const count = tokens.filter((t) => t.category === cat.key).length;
          return <button key={cat.key} onClick={() => setFilter(cat.key)} className={`text-xs px-3 py-1.5 rounded-full border ${filter === cat.key ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-600 border-gray-300'}`}>{cat.label} ({count})</button>;
        })}
      </div>

      {/* Token list */}
      <div className="space-y-3">
        {filtered.map((token, _fi) => {
          const idx = tokens.indexOf(token);
          const stack = FONT_STACKS[token.fontFamily];
          return (
            <div key={token.name} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{token.name}</span>
                <span className="text-sm font-semibold text-gray-900">{token.label}</span>
                <span className="text-xs text-gray-400 flex-1">{token.usedIn[0]}{token.usedIn.length > 1 ? ` +${token.usedIn.length - 1} more` : ''}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{stack.label}</span>
              </div>
              {/* Desktop + Mobile side by side */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {(['desktop', 'mobile'] as const).map((vp) => {
                  const vals = token[vp];
                  const updater = vp === 'desktop' ? updateDesktop : updateMobile;
                  return (
                    <div key={vp} className="px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{vp === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div><label className="text-[10px] text-gray-500">Size</label><input type="number" value={vals.fontSize} onChange={(e) => updater(idx, { fontSize: +e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" /></div>
                        <div><label className="text-[10px] text-gray-500">Line H</label><input type="number" value={vals.lineHeight} onChange={(e) => updater(idx, { lineHeight: +e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" /></div>
                        <div><label className="text-[10px] text-gray-500">Weight</label><input type="number" value={vals.fontWeight} onChange={(e) => updater(idx, { fontWeight: +e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" step={100} /></div>
                        <div><label className="text-[10px] text-gray-500">Spacing</label><input value={vals.letterSpacing || ''} onChange={(e) => updater(idx, { letterSpacing: e.target.value || undefined })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" placeholder="0" /></div>
                      </div>
                      {/* Preview */}
                      <p className="mt-2 truncate" style={{
                        fontFamily: fonts[token.fontFamily] || stack.default,
                        fontSize: `${vals.fontSize}px`,
                        lineHeight: `${vals.lineHeight}px`,
                        fontWeight: vals.fontWeight,
                        letterSpacing: vals.letterSpacing || undefined,
                        textTransform: (vals.textTransform as any) || undefined,
                      }}>
                        {({
                          'display-xxl': '01',
                          'display-xl': 'Rhubarbe',
                          'display-lg': 'FAQs',
                          'display-md': 'How it started',
                          'display-sm': '\u201cA brief message\u201d',
                          'heading-xl': 'VISIT US',
                          'heading-lg': 'Instructions',
                          'heading-md': 'Ordering',
                          'heading-sm': 'The First Strawberries',
                          'heading-xs': 'Our Philosophy',
                          'body-xl': 'What are your hours?',
                          'body-lg': 'St\u00e9phanie Labelle believed there was a gap in Montreal.',
                          'body-md': 'A brief message about the story and ordering.',
                          'body-sm': 'Your order has been confirmed.',
                          'body-xs': 'Taxes calculated at checkout',
                          'caption-lg': 'Dark chocolate mousse with salted caramel.',
                          'caption-md': 'fig. 03 \u2013 friends having a drink',
                          'caption-sm': 'STORIES \u00b7 10.05.2026',
                          'caption-xs': 'WORD BY ST\u00c9PHANIE',
                        } as Record<string, string>)[token.name] || token.label}
                      </p>
                      <span className="text-[9px] text-gray-400 mt-1 block">{vals.fontSize}px / {vals.lineHeight}px / {vals.fontWeight}</span>
                    </div>
                  );
                })}
              </div>
              {/* Used in */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Used in ({token.usedIn.length})</p>
                <div className="flex flex-wrap gap-1">
                  {token.usedIn.map((u, i) => <span key={i} className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{u}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
