import RequestForm from '@/components/RequestForm';

export const metadata = {
  title: 'Signature Cakes – Rhubarbe',
  description: 'Custom signature cakes and wedding cakes.',
};

export default function GateauxSignaturesPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">signature cakes</h1>
        <p className="text-gray-600 leading-relaxed">
          Rhubarbe also offers a signature cake service for weddings and special occasions.
        </p>
        <p className="text-sm text-gray-400">download menu (coming soon)</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500">contact us via the form below</p>
        <RequestForm type="gateaux" />
      </div>
    </main>
  );
}
