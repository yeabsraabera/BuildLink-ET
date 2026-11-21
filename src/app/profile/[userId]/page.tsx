import { Suspense } from "react";

import { ProfileView } from "@/components/profile-view";

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">Loading profile...</p>}>
      <ResolvedProfile params={params} />
    </Suspense>
  );
}

async function ResolvedProfile({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <ProfileView userId={userId} />;
}
