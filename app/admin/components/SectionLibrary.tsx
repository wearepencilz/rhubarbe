'use client';

import { SECTION_CATEGORIES, SECTION_META, type SectionType } from '@/lib/types/sections';

const bg = '#F7F6F3';
const accent = '#D49BCB';
const dark = '#1A3821';
const gray = '#ccc';

// Unique mini-preview for each section type — rendered as tiny HTML thumbnails
function MiniPreview({ type }: { type: SectionType }) {
  const box = "w-full h-20 flex items-center overflow-hidden rounded";
  const bar = (w: string, c = gray) => <div style={{ width: w, height: 4, backgroundColor: c, borderRadius: 2 }} />;
  const block = (w: string, h: string, c = gray) => <div style={{ width: w, height: h, backgroundColor: c, borderRadius: 2, flexShrink: 0 }} />;

  switch (type) {
    case 'faq-simple':
      return <div className={box} style={{ backgroundColor: accent, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }}>{bar('60%', dark)}</div>
        <div style={{ width: '50%' }} className="space-y-1.5">{[1,2,3,4].map(i => <div key={i} className="flex justify-between items-center"><div>{bar('70%')}</div><span style={{ fontSize: 8, color: dark }}>+</span></div>)}</div>
      </div>;
    case 'faq-grouped':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }}>{bar('60%', dark)}</div>
        <div style={{ width: '50%' }} className="space-y-2">{bar('40%', dark)}<div className="space-y-1">{[1,2].map(i => <div key={i}>{bar('80%')}</div>)}</div>{bar('50%', dark)}<div className="space-y-1">{[1,2].map(i => <div key={i}>{bar('75%')}</div>)}</div></div>
      </div>;
    case 'image-carousel':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 6 }}>
        <div className="flex-1 space-y-1">{bar('60%', dark)}{bar('90%')}{bar('70%')}</div>
        <div className="flex gap-1">{block('12px', '28px')}{block('12px', '28px')}</div>
        {block('40px', '60px')}
      </div>;
    case 'image-2up':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 6 }}>
        {block('50%', '60px')}{block('50%', '60px')}
      </div>;
    case 'image-hero':
      return <div className={box}>{block('100%', '80px', '#999')}</div>;
    case 'image-with-icons':
      return <div className={box} style={{ position: 'relative' }}>
        {block('100%', '80px', '#999')}
        <div style={{ position: 'absolute', bottom: 8, left: 12, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#AAC038' }} />
      </div>;
    case 'content-brief':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 6 }}>
        {[1,2,3].map(i => <div key={i} className="flex-1 space-y-1">{block('100%', '36px')}<div>{bar('20%', dark)}</div>{bar('90%')}</div>)}
      </div>;
    case 'content-journal':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 6 }}>
        {[1,2,3].map(i => <div key={i} className="flex-1 space-y-1">{block('100%', '36px')}<div className="flex gap-1">{bar('20%')}{bar('30%')}</div>{bar('60%', dark)}{bar('80%')}</div>)}
      </div>;
    case 'content-2up':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 6 }}>
        {[1,2].map(i => <div key={i} className="flex-1 space-y-1">{block('100%', '48px')}<div className="flex justify-between">{bar('30%')}{bar('50%', dark)}</div></div>)}
      </div>;
    case 'heading-articles':
      return <div className={box} style={{ backgroundColor: bg, padding: '24px 8px 8px' }}>
        <div className="space-y-2">{bar('50%', dark)}<div className="flex gap-2">{bar('30%')}{bar('30%', '#aaa')}{bar('30%', '#aaa')}</div></div>
      </div>;
    case 'heading-page':
      return <div className={box} style={{ backgroundColor: bg, padding: '24px 8px 8px' }}>
        {bar('40%', dark)}
      </div>;
    case 'heading-content':
      return <div className={box} style={{ backgroundColor: bg, padding: '24px 8px 8px' }}>
        <div className="space-y-1">{bar('60%', dark)}<div className="flex gap-1">{bar('20%')}{bar('25%')}</div></div>
      </div>;
    case 'quote':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }} />
        <div style={{ width: '50%' }} className="space-y-1"><span style={{ fontSize: 14, color: dark, lineHeight: 1 }}>&ldquo;</span>{bar('90%', dark)}{bar('70%', dark)}</div>
      </div>;
    case 'text':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }} />
        <div style={{ width: '50%' }} className="space-y-1.5">{bar('50%', dark)}{bar('95%')}{bar('85%')}{bar('60%')}</div>
      </div>;
    case 'instructions':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }} />
        <div style={{ width: '50%' }} className="space-y-1">{bar('50%', dark)}{['1.', '2.', '3.'].map(n => <div key={n} className="flex gap-1 items-center"><span style={{ fontSize: 7, color: dark }}>{n}</span>{bar('80%')}</div>)}</div>
      </div>;
    case 'two-column-text':
      return <div className={box} style={{ backgroundColor: bg, padding: 12 }}>
        <div className="w-full space-y-1.5">{bar('30%', dark)}<div className="flex gap-3"><div className="flex-1 space-y-1">{bar('95%')}{bar('80%')}{bar('90%')}</div><div className="flex-1 space-y-1">{bar('90%')}{bar('85%')}{bar('70%')}</div></div></div>
      </div>;
    case 'steps':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }} />
        <div style={{ width: '50%' }} className="space-y-1">{['01','02','03'].map(n => <div key={n} className="flex items-baseline gap-1"><span style={{ fontSize: 14, fontWeight: 600, color: dark, lineHeight: 1 }}>{n}</span>{bar('70%')}</div>)}</div>
      </div>;
    case 'image-with-text':
      return <div className={box} style={{ backgroundColor: accent, padding: 8, gap: 8 }}>
        {block('40%', '60px', '#999')}
        <div className="flex-1 space-y-1">{bar('50%', dark)}{bar('90%', dark)}{bar('70%', dark)}</div>
      </div>;
    case 'contact-form':
      return <div className={box} style={{ backgroundColor: bg, padding: 8, gap: 8 }}>
        <div style={{ width: '50%' }}>{bar('60%', dark)}</div>
        <div style={{ width: '50%' }} className="space-y-1">{[1,2,3].map(i => <div key={i}>{bar('100%', '#ddd')}</div>)}{block('100%', '14px', accent)}<div className="flex gap-1 mt-1">{bar('40%')}{bar('50%', '#bbb')}</div></div>
      </div>;
    default:
      return <div className={box} style={{ backgroundColor: bg }} />;
  }
}

interface SectionLibraryProps {
  onSelect: (type: SectionType) => void;
  onClose: () => void;
}

export default function SectionLibrary({ onSelect, onClose }: SectionLibraryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-8">
          {Object.entries(SECTION_CATEGORIES).map(([key, { label, types }]) => (
            <div key={key}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{label}</h3>
              <div className="grid grid-cols-3 gap-3">
                {types.map((type) => {
                  const meta = SECTION_META[type];
                  return (
                    <button
                      key={type}
                      onClick={() => { onSelect(type); onClose(); }}
                      className="group flex flex-col rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden text-left"
                    >
                      <MiniPreview type={type} />
                      <div className="p-2.5 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-900">{meta.icon} {meta.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
