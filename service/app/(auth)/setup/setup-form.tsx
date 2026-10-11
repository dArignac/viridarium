"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setupAdminAction } from "@/src/lib/auth/actions";

export default function SetupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(checks).every(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please meet all password requirements before proceeding.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await setupAdminAction({
        displayName,
        email,
        password,
      });

      if (res.success) {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create administrator account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
          Your Name
        </label>
        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Garden Host"
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
          Admin Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Password Strength Checklist */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className={checks.length ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
            {checks.length ? "✓" : "○"} 12+ characters
          </span>
          <span className={checks.upper ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
            {checks.upper ? "✓" : "○"} 1 uppercase
          </span>
          <span className={checks.lower ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
            {checks.lower ? "✓" : "○"} 1 lowercase
          </span>
          <span className={checks.number ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
            {checks.number ? "✓" : "○"} 1 number
          </span>
          <span className={checks.symbol ? "text-emerald-600 dark:text-emerald-400 font-medium col-span-2" : "col-span-2"}>
            {checks.symbol ? "✓" : "○"} 1 special symbol (!@#$%^&*)
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isPasswordValid}
        className="w-full mt-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
      >
        {loading ? "Creating account..." : "Complete Setup & Sign In"}
      </button>
    </form>
  );
}
