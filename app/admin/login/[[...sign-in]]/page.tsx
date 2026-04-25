import { SignIn } from '@clerk/nextjs';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SignIn afterSignInUrl="/admin" />
    </div>
  );
}
