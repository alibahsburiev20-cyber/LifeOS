// SPDX-License-Identifier: Apache-2.0
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Encryption of stored secrets (API keys) with AES-256-GCM. See threat T5 in docs/phase-0/02-threat-model.md.
// The key is never stored in the database: it comes from LIFEOS_SECRET_KEY or from a key file.

const ALGORITHM = "aes-256-gcm";

export interface SecretBox {
  encrypt(plain: string): string;
  decrypt(payload: string): string;
}

export function createSecretBox(key: Buffer): SecretBox {
  if (key.length !== 32) throw new Error("The secret key must be exactly 32 bytes");
  return {
    encrypt(plain) {
      const iv = randomBytes(12);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      return ["v1", iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
    },
    decrypt(payload) {
      const [version, ivB64, tagB64, dataB64] = payload.split(":");
      if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
        throw new Error("Invalid secret payload");
      }
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
      decipher.setAuthTag(Buffer.from(tagB64, "base64"));
      const data = Buffer.concat([
        decipher.update(Buffer.from(dataB64, "base64")),
        decipher.final(),
      ]);
      return data.toString("utf8");
    },
  };
}

/**
 * Finds the encryption key: LIFEOS_SECRET_KEY (32 bytes, base64) if set, otherwise a key file
 * next to the database that is created on first use with owner-only permissions.
 * For stronger protection keep the key outside the data directory (use the environment variable).
 */
export function loadSecretKey(
  dbPath: string,
  envValue: string | undefined = process.env.LIFEOS_SECRET_KEY,
): Buffer {
  if (envValue) {
    const key = Buffer.from(envValue, "base64");
    if (key.length !== 32) {
      throw new Error("LIFEOS_SECRET_KEY must be 32 bytes encoded as base64");
    }
    return key;
  }
  if (dbPath === ":memory:") return randomBytes(32);

  const file = join(dirname(dbPath), "secret.key");
  if (existsSync(file)) {
    const key = Buffer.from(readFileSync(file, "utf8").trim(), "base64");
    if (key.length !== 32) throw new Error(`${file} does not contain a valid 32-byte key`);
    return key;
  }
  mkdirSync(dirname(file), { recursive: true });
  const key = randomBytes(32);
  writeFileSync(file, key.toString("base64"), { mode: 0o600 });
  try {
    chmodSync(file, 0o600);
  } catch {
    // Best effort on platforms without POSIX permissions.
  }
  return key;
}
