import RequestForm from '@/components/RequestForm';

export const metadata = {
  title: 'Catering – Rhubarbe',
  description: 'Catering service for all types of events.',
};

export default function TraiteurPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">catering</h1>
        <p className="text-gray-600 leading-relaxed">
          Rhubarbe offers a catering service for all types of events — business meetings,
          family gatherings, and even in-home service.
        </p>
        <p className="text-sm text-gray-400">download menu (coming soon)</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500">contact us via the form below</p>
        <RequestForm type="traiteur" />
      </div>
    </main>
  );
}
