import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { requireServerEnv } from "@/lib/env";

/**
 * Field-level encryption for PII columns (`*_enc`). AES-256-GCM with a random 96-bit IV per
 * value; output is `v1.<base64(iv | tag | ciphertext)>`. The version prefix leaves room to
 * rotate keys later without a flag day.
 */
const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function parseKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32)");
  return key;
}

export function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${VERSION}.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64")}`;
}

export function decryptWithKey(payload: string, key: Buffer): string {
  const [version, body] = payload.split(".", 2);
  if (version !== VERSION || !body) throw new Error("Unrecognized ciphertext format");
  const raw = Buffer.from(body, "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
}

let cachedKey: Buffer | undefined;
const key = () => (cachedKey ??= parseKey(requireServerEnv("ENCRYPTION_KEY")));

export const encrypt = (plaintext: string) => encryptWithKey(plaintext, key());
export const decrypt = (payload: string) => decryptWithKey(payload, key());
export const encryptJson = (value: unknown) => encrypt(JSON.stringify(value));
export const decryptJson = <T>(payload: string) => JSON.parse(decrypt(payload)) as T;
