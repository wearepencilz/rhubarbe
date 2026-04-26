'use client';

import { useState, useEffect } from 'react';
import FaqClient from '@/components/sections/FaqClient';

interface FaqItem { id: string; topic: string; question: { en: string; fr: string }; answer: { en: string; fr: string }; sortOrder: number; }

interface Props {
  topic?: string;
  topics?: string[];
  onTopicChange?: (topic: string) => void;
  onTopicsChange?: (topics: string[]) => void;
  grouped?: boolean;
}

export default function FaqLivePreview({ topic, topics, onTopicChange, onTopicsChange, grouped }: Props) {
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [topicLabels, setTopicLabels] = useState<Record<string, { en: string; fr: string }>>({});
  const [faqsByTopic, setFaqsByTopic] = useState<Record<string, FaqItem[]>>({});

  useEffect(() => {
    fetch('/api/faqs/topics').then((r) => r.json()).then(setAllTopics).catch(() => {});
    fetch('/api/faqs').then((r) => r.json()).then((items: FaqItem[]) => {
      const g: Record<string, FaqItem[]> = {};
      items.forEach((f) => { (g[f.topic] ??= []).push(f); });
      setFaqsByTopic(g);
    }).catch(() => {});
    fetch('/api/settings').then((r) => r.json()).then((s: any) => {
      if (s?.faqTopicLabels) setTopicLabels(s.faqTopicLabels);
    }).catch(() => {});
  }, []);

  const label = (t: string) => topicLabels[t]?.en || t;

  if (grouped) {
    const selected = topics || [];
    const moveUp = (i: number) => { if (i === 0) return; const n = [...selected]; [n[i-1], n[i]] = [n[i], n[i-1]]; onTopicsChange?.(n); };
    const moveDown = (i: number) => { if (i >= selected.length - 1) return; const n = [...selected]; [n[i], n[i+1]] = [n[i+1], n[i]]; onTopicsChange?.(n); };
    const toggle = (t: string) => {
      onTopicsChange?.(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]);
    };

    return (
      <div className="space-y-6">
        {/* Available topics */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Select topics</p>
          <div className="flex flex-wrap gap-2">
            {allTopics.map((t) => (
              <button key={t} onClick={() => toggle(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selected.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                {label(t)} ({(faqsByTopic[t] || []).length})
              </button>
            ))}
            {allTopics.length === 0 && <p className="text-xs text-gray-400">No topics yet — create FAQs first.</p>}
          </div>
        </div>

        {/* Selected topics — reorderable */}
        {selected.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Order ({selected.length} selected)</p>
            <div className="space-y-1">
              {selected.map((t, i) => (
                <div key={t} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-[10px] leading-none">▲</button>
                    <button onClick={() => moveDown(i)} disabled={i >= selected.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-[10px] leading-none">▼</button>
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-1">{label(t)}</span>
                  <span className="text-xs text-gray-400">{(faqsByTopic[t] || []).length} Q&As</span>
                  <button onClick={() => toggle(t)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {selected.map((t) => (
          <div key={t} className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: '#1A3821' }}>{label(t)}</h3>
            <FaqClient items={(faqsByTopic[t] || []).sort((a, b) => a.sortOrder - b.sortOrder).map((f) => ({ q: f.question.en || f.question.fr, a: f.answer.en || f.answer.fr }))} />
          </div>
        ))}
      </div>
    );
  }

  // Simple — single topic
  const items = (faqsByTopic[topic || ''] || []).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Select topic</p>
        <div className="flex flex-wrap gap-2">
          {allTopics.map((t) => (
            <button key={t} onClick={() => onTopicChange?.(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${topic === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
              {label(t)} ({(faqsByTopic[t] || []).length})
            </button>
          ))}
          {allTopics.length === 0 && <p className="text-xs text-gray-400">No topics yet — create FAQs first.</p>}
        </div>
      </div>
      {items.length > 0 && <FaqClient items={items.map((f) => ({ q: f.question.en || f.question.fr, a: f.answer.en || f.answer.fr }))} />}
    </div>
  );
}
