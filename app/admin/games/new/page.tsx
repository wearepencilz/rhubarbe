import { Metadata } from 'next';
import CreateCampaignForm from './CreateCampaignForm';

export const metadata: Metadata = {
  title: 'Create Campaign | Admin',
};

export default function CreateCampaignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-gray-600 mt-1">
          Set up a new pixel art game campaign with rewards
        </p>
      </div>

      <CreateCampaignForm />
    </div>
  );
}
