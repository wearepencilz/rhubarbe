'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import TranslationFields from '@/app/admin/components/TranslationFields';
import AdminLocaleSwitcher from '@/app/admin/components/AdminLocaleSwitcher';
import { useToast } from '@/app/admin/components/ToastContainer';
import type { ContentTranslations } from '@/types';

const TEMPLATE_KEY = 'volume-order-confirmation';

const AVAILABLE_VARIABLES = [
  { variable: '{{orderNumber}}', description: 'The Shopify order number' },
  { variable: '{{customerName}}', description: 'Customer full name' },
  { variable: '{{fulfillmentDate}}', description: 'Requested fulfillment date' },
  { variable: '{{fulfillmentTime}}', description: 'Requested fulfillment time' },
  { variable: '{{variantBreakdown}}', description: 'List of variants with quantities' },
  { variable: '{{allergenNote}}', description: 'Customer allergen concerns (omitted if empty)' },
  { variable: '{{totalQuantity}}', description: 'Total units across all variants' },
];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export default function EmailTemplatePage() {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);

  // Form state — EN base values
  const [subjectEn, setSubjectEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');

  // FR translations
  const [subjectFr, setSubjectFr] = useState('');
  const [bodyFr, setBodyFr] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, []);

  async function fetchTemplate() {
    try {
      setLoading(true);
      const res = await fetch(`/api/settings/email-templates/${TEMPLATE_KEY}`);
      if (res.ok) {
        const data = await res.json();
        setSubjectEn(data.subject?.en ?? '');
        setSubjectFr(data.subject?.fr ?? '');
        setBodyEn(data.body?.en ?? '');
        setBodyFr(data.body?.fr ?? '');
      }
      // 404 is fine — template hasn't been created yet
    } catch {
      setError('Failed to load email template');
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback(() => setIsDirty(true), []);

  // Translation helpers
  const subjectTranslations: ContentTranslations = { fr: { subject: subjectFr || undefined } };
  const bodyTranslations: ContentTranslations = { fr: { body: bodyFr || undefined } };

  async function handleSave() {
    setError(undefined);

    if (!subjectEn.trim()) {
      toast.error('Validation error', 'English subject is required');
      return;
    }
    if (!bodyEn.trim()) {
      toast.error('Validation error', 'English body is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/settings/email-templates/${TEMPLATE_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: { en: subjectEn, fr: subjectFr },
          body: { en: bodyEn, fr: bodyFr },
        }),
      });

      if (res.ok) {
        setIsDirty(false);
        toast.success('Saved', 'Email template updated');
      } else {
        const err = await res.json();
        const msg = err.error || 'Failed to save';
        setError(msg);
        toast.error('Save failed', msg);
      }
    } catch {
      setError('An unexpected error occurred');
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push('/admin/volume-products');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <EditPageLayout
      title="Catering Order Confirmation Email"
      backHref="/admin/volume-products"
      backLabel="Back to Catering Products"
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      error={error}
      isDirty={isDirty}
      maxWidth="4xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Locale switcher */}
          <div className="flex justify-end">
            <AdminLocaleSwitcher />
          </div>

          {/* Subject */}
          <SectionCard title="Subject" description="The email subject line sent to customers.">
            <TranslationFields
              base={{ subject: subjectEn }}
              translations={subjectTranslations}
              onBaseChange={(_field, value) => {
                setSubjectEn(value);
                markDirty();
              }}
              onChange={(t) => {
                setSubjectFr(t?.fr?.subject ?? '');
                markDirty();
              }}
              fields={[
                {
                  key: 'subject',
                  label: 'Subject',
                  type: 'input',
                  placeholder: 'e.g., Your catering order #{{orderNumber}} is confirmed',
                },
              ]}
            />
          </SectionCard>

          {/* Body */}
          <SectionCard title="Body" description="The email body content. Use variables from the reference guide.">
            <TranslationFields
              base={{ body: bodyEn }}
              translations={bodyTranslations}
              onBaseChange={(_field, value) => {
                setBodyEn(value);
                markDirty();
              }}
              onChange={(t) => {
                setBodyFr(t?.fr?.body ?? '');
                markDirty();
              }}
              fields={[
                {
                  key: 'body',
                  label: 'Body',
                  type: 'textarea',
                  rows: 12,
                  placeholder: 'Write the email body here. Use {{variables}} for dynamic content...',
                },
              ]}
            />
          </SectionCard>
        </div>

        {/* Right column: variable reference */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <SectionCard title="Available Variables" description="Use these in the subject or body fields.">
              <div className="space-y-3">
                {AVAILABLE_VARIABLES.map((v) => (
                  <div key={v.variable}>
                    <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-brand-700">
                      {v.variable}
                    </code>
                    <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </EditPageLayout>
  );
}
