import crypto from "node:crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function generateTotpSecret(email: string) {
  const secret = generateSecret();
  const uri = generateURI({
    issuer: "Viridarium",
    label: email,
    secret,
  });
  return { secret, uri };
}

export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { margin: 2, width: 256 });
}

export function verifyTotpToken(secret: string, token: string): boolean {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }
  try {
    const result = verifySync({ token, secret });
    return Boolean(result && result.valid);
  } catch {
    return false;
  }
}

export function verifyRecoveryCode(
  recoveryCodesJson: string | null | undefined,
  enteredCode: string
): { valid: boolean; remainingCodes: string[] } {
  if (!recoveryCodesJson || !enteredCode) {
    return { valid: false, remainingCodes: [] };
  }

  try {
    const codes: string[] = JSON.parse(recoveryCodesJson);
    const normalizedInput = enteredCode.trim().toUpperCase();
    const index = codes.indexOf(normalizedInput);

    if (index === -1) {
      return { valid: false, remainingCodes: codes };
    }

    const remainingCodes = [
      ...codes.slice(0, index),
      ...codes.slice(index + 1),
    ];
    return { valid: true, remainingCodes };
  } catch {
    return { valid: false, remainingCodes: [] };
  }
}
