"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/src/lib/auth/actions";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-medium text-zinc-500 hover:text-red-600 transition px-2 py-1 rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
    >
      Sign Out
    </button>
  );
}
