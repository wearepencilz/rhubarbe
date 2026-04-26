'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Trash01, Edit01, ChevronDown, ChevronUp } from '@untitledui/icons';

interface Faq { id: string; topic: string; question: { en: string; fr: string }; answer: { en: string; fr: string }; sortOrder: number; }

function SortableItem({ faq, onEdit, onDelete }: { faq: Faq; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: faq.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-start gap-3">
      <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 touch-none mt-0.5">⠿</button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{faq.question.en || faq.question.fr}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{faq.answer.en || faq.answer.fr}</p>
        {(faq.question.fr && faq.question.en) && <p className="text-xs text-blue-400 mt-1">🇫🇷 {faq.question.fr}</p>}
      </div>
      <button onClick={onEdit} className="p-1 text-gray-400 hover:text-gray-600 shrink-0"><Edit01 className="w-4 h-4" /></button>
      <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash01 className="w-4 h-4" /></button>
    </div>
  );
}

export default function FaqsPage() {
  const toast = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [deleteId, setDeleteId] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [topicLabels, setTopicLabels] = useState<Record<string, { en: string; fr: string }>>({});
  const [editingTopic, setEditingTopic] = useState<{ key: string; en: string; fr: string } | null>(null);
  const [deleteTopic, setDeleteTopic] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = () => {
    fetch('/api/faqs').then((r) => r.json()).then((data: Faq[]) => {
      setFaqs(data);
      if (expandedTopics.size === 0) setExpandedTopics(new Set(data.map((f) => f.topic)));
    }).catch(() => {});
    fetch('/api/settings').then((r) => r.json()).then((s: any) => {
      if (s?.faqTopicLabels) setTopicLabels(s.faqTopicLabels);
    }).catch(() => {});
  };
  const saveTopicLabels = async (labels: Record<string, { en: string; fr: string }>) => {
    setTopicLabels(labels);
    const current = await fetch('/api/settings').then((r) => r.json());
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...current, faqTopicLabels: labels }) });
  };
  useEffect(() => { load(); setTimeout(() => setLoading(false), 500); }, []);

  const topics = [...new Set(faqs.map((f) => f.topic))].sort();

  const toggleTopic = (t: string) => setExpandedTopics((prev) => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  const startNew = (topic: string) => setEditing({
    id: '', topic, question: { en: '', fr: '' }, answer: { en: '', fr: '' },
    sortOrder: faqs.filter((f) => f.topic === topic).length,
  });

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.question.en && !editing.question.fr) { toast.error('Question is required'); return; }
    const isNew = !editing.id;
    const url = isNew ? '/api/faqs' : `/api/faqs/${editing.id}`;
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    if (res.ok) {
      toast.success(isNew ? 'Added' : 'Saved');
      setEditing(null);
      load();
      setExpandedTopics((prev) => new Set(prev).add(editing.topic));
    } else toast.error('Failed');
  };

  const handleDelete = async () => {
    await fetch(`/api/faqs/${deleteId}`, { method: 'DELETE' });
    toast.success('Deleted'); setDeleteId(''); load();
  };

  const handleReorder = useCallback(async (topic: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const topicFaqs = faqs.filter((f) => f.topic === topic).sort((a, b) => a.sortOrder - b.sortOrder);
    const reordered = arrayMove(topicFaqs, topicFaqs.findIndex((f) => f.id === active.id), topicFaqs.findIndex((f) => f.id === over.id));
    const updated = reordered.map((f, i) => ({ ...f, sortOrder: i }));
    setFaqs([...faqs.filter((f) => f.topic !== topic), ...updated]);
    for (const faq of updated) {
      fetch(`/api/faqs/${faq.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: faq.sortOrder }) });
    }
  }, [faqs]);

  const handleCreateTopic = () => {
    if (!newTopicName.trim()) return;
    startNew(newTopicName.trim());
    setShowNewTopic(false);
    setNewTopicName('');
  };

  if (loading) return <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="admin-narrow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">FAQs</h1>
          <p className="text-sm text-gray-500 mt-1">{topics.length} topics · {faqs.length} items · Drag to reorder</p>
        </div>
        <Button color="primary" size="sm" onClick={() => setShowNewTopic(true)}>+ New Topic</Button>
      </div>

      {/* New topic inline */}
      {showNewTopic && (
        <div className="flex gap-2 mb-4">
          <Input value={newTopicName} onChange={setNewTopicName} placeholder="Topic name, e.g. Ordering & Timing" autoFocus />
          <Button color="primary" size="sm" onClick={handleCreateTopic} isDisabled={!newTopicName.trim()}>Create & Add FAQ</Button>
          <Button color="secondary" size="sm" onClick={() => { setShowNewTopic(false); setNewTopicName(''); }}>Cancel</Button>
        </div>
      )}

      {/* Topics */}
      <div className="space-y-4">
        {topics.map((topic) => {
          const topicFaqs = faqs.filter((f) => f.topic === topic).sort((a, b) => a.sortOrder - b.sortOrder);
          const isExpanded = expandedTopics.has(topic);
          return (
            <div key={topic} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Topic header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                <button onClick={() => toggleTopic(topic)} className="flex-1 text-left">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {topicLabels[topic]?.en || topic}
                    {topicLabels[topic]?.fr && <span className="text-xs text-gray-400 ml-2">🇫🇷 {topicLabels[topic].fr}</span>}
                  </h2>
                  <p className="text-xs text-gray-500">{topicFaqs.length} question{topicFaqs.length !== 1 ? 's' : ''}</p>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingTopic({ key: topic, en: topicLabels[topic]?.en || topic, fr: topicLabels[topic]?.fr || '' })} className="p-1.5 text-gray-400 hover:text-gray-600"><Edit01 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTopic(topic)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash01 className="w-4 h-4" /></button>
                  <button onClick={() => toggleTopic(topic)} className="p-1.5 text-gray-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Items */}
              {isExpanded && (
                <div className="p-4 space-y-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleReorder(topic, e)}>
                    <SortableContext items={topicFaqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                      {topicFaqs.map((faq) => (
                        <SortableItem key={faq.id} faq={faq} onEdit={() => setEditing(faq)} onDelete={() => setDeleteId(faq.id)} />
                      ))}
                    </SortableContext>
                  </DndContext>
                  {topicFaqs.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No questions yet</p>}
                  <button onClick={() => startNew(topic)} className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                    + Add question to {topic}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {topics.length === 0 && <p className="text-sm text-gray-400 text-center py-12">No FAQ topics yet. Create one to get started.</p>}
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editing.id ? 'Edit FAQ' : `New FAQ in "${editing.topic}"`}</h2>
            <Input label="Topic" value={editing.topic} onChange={(v) => setEditing({ ...editing, topic: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <div className="grid grid-cols-2 gap-3">
                <Textarea label="🇬🇧 EN" value={editing.question.en} onChange={(v) => setEditing({ ...editing, question: { ...editing.question, en: v } })} rows={2} placeholder="Question in English" />
                <Textarea label="🇫🇷 FR" value={editing.question.fr} onChange={(v) => setEditing({ ...editing, question: { ...editing.question, fr: v } })} rows={2} placeholder="Question en français" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <div className="grid grid-cols-2 gap-3">
                <Textarea label="🇬🇧 EN" value={editing.answer.en} onChange={(v) => setEditing({ ...editing, answer: { ...editing.answer, en: v } })} rows={5} placeholder="Answer in English" />
                <Textarea label="🇫🇷 FR" value={editing.answer.fr} onChange={(v) => setEditing({ ...editing, answer: { ...editing.answer, fr: v } })} rows={5} placeholder="Réponse en français" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button color="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button color="primary" size="sm" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteId} variant="danger" title="Delete FAQ" message="Delete this question? This cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" onConfirm={handleDelete} onCancel={() => setDeleteId('')} />

      {/* Edit topic modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingTopic(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Edit Topic Name</h2>
            <Input label="🇬🇧 English" value={editingTopic.en} onChange={(v) => setEditingTopic({ ...editingTopic, en: v })} />
            <Input label="🇫🇷 Français" value={editingTopic.fr} onChange={(v) => setEditingTopic({ ...editingTopic, fr: v })} />
            <div className="flex justify-end gap-3">
              <Button color="secondary" size="sm" onClick={() => setEditingTopic(null)}>Cancel</Button>
              <Button color="primary" size="sm" onClick={async () => {
                await saveTopicLabels({ ...topicLabels, [editingTopic.key]: { en: editingTopic.en, fr: editingTopic.fr } });
                toast.success('Topic updated');
                setEditingTopic(null);
              }}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete topic confirmation */}
      <ConfirmModal isOpen={!!deleteTopic} variant="danger" title="Delete Topic" message={`Delete "${deleteTopic}" and all its FAQ items? This cannot be undone.`} confirmLabel="Delete All" cancelLabel="Cancel" onConfirm={async () => {
        const topicFaqs = faqs.filter((f) => f.topic === deleteTopic);
        for (const faq of topicFaqs) { await fetch(`/api/faqs/${faq.id}`, { method: 'DELETE' }); }
        const newLabels = { ...topicLabels }; delete newLabels[deleteTopic]; await saveTopicLabels(newLabels);
        toast.success('Topic deleted');
        setDeleteTopic('');
        load();
      }} onCancel={() => setDeleteTopic('')} />
    </div>
  );
}
