import { Suspense } from "react";

import { ProfileView } from "@/components/profile-view";

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="h-20 animate-pulse rounded-xl bg-line" />
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-line" />
          <p className="sr-only">Loading profile...</p>
        </div>
      }
    >
      <ResolvedProfile params={params} />
    </Suspense>
  );
}

async function ResolvedProfile({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <ProfileView userId={userId} />;
}
