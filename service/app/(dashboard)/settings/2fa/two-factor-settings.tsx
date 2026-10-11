"use client";

import { useState } from "react";
import {
  confirm2faEnableAction,
  generate2faSetupAction,
} from "@/src/lib/auth/actions";

interface Props {
  userId: string;
  email: string;
  initialEnabled: boolean;
}

export default function TwoFactorSettings({
  userId,
  email,
  initialEnabled,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrDataUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const data = await generate2faSetupAction(email);
      setSetupData(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to initialize 2FA setup.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!setupData) return;

    setLoading(true);
    setError(null);

    try {
      const res = await confirm2faEnableAction({
        userId,
        secret: setupData.secret,
        code: verificationCode.trim(),
        recoveryCodes: setupData.recoveryCodes,
      });

      if (!res.success) {
        setError(res.error || "Invalid code. Please check your authenticator.");
        return;
      }

      setEnabled(true);
      setSetupData(null);
      setVerificationCode("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm 2FA.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Authenticator App (TOTP)</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Require a 6-digit code from Google Authenticator, Bitwarden, or 1Password when signing in.
          </p>
        </div>
        <div>
          {enabled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Enabled
            </span>
          ) : (
            <button
              onClick={startSetup}
              disabled={loading || Boolean(setupData)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              Set Up 2FA
            </button>
          )}
        </div>
      </div>

      {/* Setup Wizard Panel */}
      {setupData && !enabled && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-semibold">Scan QR Code</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Open your authenticator app and scan this barcode, or manually paste the secret key.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <div className="p-2 bg-white rounded-xl border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setupData.qrDataUrl}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Manual Setup Key
              </span>
              <p className="font-mono text-sm tracking-wider bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg select-all">
                {setupData.secret}
              </p>
            </div>
          </div>

          {/* Recovery Codes */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              ⚠️ Save Your Backup Recovery Codes
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              If you lose access to your device, each code can be used once to log in.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 select-all">
              {setupData.recoveryCodes.map((code) => (
                <span
                  key={code}
                  className="bg-white dark:bg-zinc-900 px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-center"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>

          {/* Verification Confirmation */}
          <form onSubmit={handleConfirm} className="space-y-4 pt-2">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                Enter 6-Digit Code to Confirm
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center font-mono text-lg tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSetupData(null)}
                className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {loading ? "Verifying..." : "Confirm & Enable 2FA"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
