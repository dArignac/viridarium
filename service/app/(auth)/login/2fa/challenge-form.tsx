"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { verify2faLoginAction } from "@/src/lib/auth/actions";

function getTempTokenSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("viridarium_2fa_temp");
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function ChallengeForm() {
  const router = useRouter();
  const tempToken = useSyncExternalStore(
    subscribeToStorage,
    getTempTokenSnapshot,
    () => null
  );

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tempToken) {
      setError("No active login session found. Please return to login.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verify2faLoginAction({
        tempToken,
        code: code.trim(),
      });

      if (!res.success) {
        setError(res.error || "Invalid code. Please try again.");
        return;
      }

      sessionStorage.removeItem("viridarium_2fa_temp");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-center">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1 text-center">
          {useRecoveryCode ? "Backup Recovery Code" : "6-Digit Authenticator Code"}
        </label>
        <input
          type="text"
          required
          autoFocus
          maxLength={useRecoveryCode ? 15 : 6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={useRecoveryCode ? "XXXX-XXXX" : "123456"}
          className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
      >
        {loading ? "Verifying..." : "Verify & Continue"}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            setUseRecoveryCode(!useRecoveryCode);
            setCode("");
            setError(null);
          }}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {useRecoveryCode
            ? "Use an authenticator code instead"
            : "Lost your device? Use a backup recovery code"}
        </button>
      </div>
    </form>
  );
}
