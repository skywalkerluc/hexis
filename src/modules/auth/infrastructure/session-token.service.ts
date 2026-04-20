import { createHash, randomBytes } from "crypto";
import { SESSION_TOKEN_BYTES } from "@/modules/auth/domain/auth.constants";

export function generateRawSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
