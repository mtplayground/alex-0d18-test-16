import { redirect } from "next/navigation";

import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in?callbackUrl=/profile/edit");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      displayName: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect("/sign-in?callbackUrl=/profile/edit");
  }

  return (
    <section className="space-y-6" aria-labelledby="edit-profile-title">
      <div>
        <p className="text-muted mb-2 text-sm font-bold uppercase">Profile</p>
        <h1
          id="edit-profile-title"
          className="text-3xl leading-tight font-bold"
        >
          Edit profile
        </h1>
      </div>

      <div className="border-border bg-surface rounded-lg border p-6">
        <EditProfileForm user={user} />
      </div>
    </section>
  );
}
