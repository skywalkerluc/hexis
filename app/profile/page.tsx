import Link from "next/link";
import { AppShell } from "@/modules/shared/presentation/components/app-shell";
import { AvatarGlyph } from "@/modules/shared/presentation/components/avatar-glyph";
import { requireOnboardedUser } from "@/shared/auth/route-guards";
import { readUserProfile } from "@/modules/users/application/read-profile.query";
import { updateProfileAction } from "@/modules/users/presentation/profile.actions";
import { logoutAction } from "@/modules/auth/presentation/auth.actions";

async function ProfilePage() {
  const user = await requireOnboardedUser();
  const profile = await readUserProfile(user.id);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  const selectedAvatar =
    profile.availableAvatars.find((avatar) => avatar.id === profile.avatarOptionId) ??
    profile.availableAvatars[0];

  if (!selectedAvatar) {
    throw new Error("No avatar options available.");
  }

  return (
    <AppShell
      title="Profile"
      eyebrow="Account"
      currentPath="/profile"
      displayName={profile.displayName}
    >
      <form action={updateProfileAction} className="grid gap-6 lg:grid-cols-12">
        <section className="hexis-card lg:col-span-8 p-6">
          <div className="flex items-center gap-4">
            <AvatarGlyph
              seed={selectedAvatar}
              initials={profile.displayName
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
              size={72}
            />
            <div>
              <p className="hexis-eyebrow">Character sheet</p>
              <p className="mt-1 text-xl font-semibold">{profile.displayName}</p>
              <p className="text-sm text-[var(--color-muted)]">{profile.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Display name</span>
              <input
                name="displayName"
                defaultValue={profile.displayName}
                className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
            <label>
              <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Timezone</span>
              <input
                name="timezone"
                defaultValue={profile.timezone}
                className="mt-1.5 w-full rounded-md border bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Avatar option</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {profile.availableAvatars.map((avatar) => (
                <label key={avatar.id} className="cursor-pointer rounded-full border p-1">
                  <input
                    type="radio"
                    name="avatarOptionId"
                    value={avatar.id}
                    defaultChecked={avatar.id === profile.avatarOptionId}
                    className="sr-only"
                  />
                  <AvatarGlyph seed={avatar} size={48} />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="rounded-md bg-[var(--color-foreground)] px-4 py-2.5 text-sm font-medium text-[var(--color-background)]">
              Save profile
            </button>
          </div>
        </section>
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-3 sm:hidden">
        <Link
          href="/settings"
          className="hexis-button-secondary px-4 py-2 text-sm"
        >
          Settings
        </Link>
        <Link
          href="/history"
          className="hexis-button-secondary px-4 py-2 text-sm"
        >
          History
        </Link>
        <form action={logoutAction}>
          <button className="hexis-button-secondary px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
        <Link
          href="/feedback"
          className="hexis-button-secondary px-4 py-2 text-sm"
        >
          Send feedback
        </Link>
      </div>
    </AppShell>
  );
}

export { ProfilePage as default };
