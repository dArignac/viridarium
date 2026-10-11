import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { users } from "@/src/db/schema/auth";
import { requireUser } from "@/src/lib/auth/guard";
import TwoFactorSettings from "./two-factor-settings";

export const dynamic = "force-dynamic";

export default async function TwoFactorSettingsPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      email: users.email,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, user.userId));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition mb-1 inline-block"
            >
              ← Back to Garden Cockpit
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Security & Two-Factor Auth</h1>
          </div>
        </div>

        <TwoFactorSettings
          userId={dbUser.id}
          email={dbUser.email}
          initialEnabled={dbUser.twoFactorEnabled}
        />
      </div>
    </div>
  );
}
