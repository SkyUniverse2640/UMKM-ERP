// ponytail: using Bun.password native Argon2id & randomUUID tokens. Add Redis session cache when multi-node.
import crypto from "crypto";

export async function hashPassword(plainText: string): Promise<string> {
  const complexity = validatePasswordComplexity(plainText);
  if (!complexity.valid) {
    throw new Error(complexity.reason);
  }
  return await Bun.password.hash(plainText, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
}

export function validatePasswordComplexity(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter." };
  }
  if (!/\d/.test(password)) {
    return { valid: false, reason: "Password must contain at least one number." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one special character." };
  }
  return { valid: true };
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(plainText, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sanitizeInput(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
