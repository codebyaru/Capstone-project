/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Derived key for AES-256-CBC encryption/decryption of session tokens.
// SECURITY: do NOT use a hardcoded default secret. Require SESSION_SECRET in production.
function getSecretSeed() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing.");
  }

  return secret;
}

function getEncryptionKey() {
  return crypto
    .createHash("sha256")
    .update(getSecretSeed())
    .digest();
}
const IV_LENGTH = 16;
/**
 * Encrypt a plain token or session payload.
 * Returns a secure base64-encoded encrypted token string containing the IV and the cipher text.
 */
export function encryptToken(text: string): string {
  try {
    const ENCRYPTION_KEY = getEncryptionKey();

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Format: iv:encrypted_text
    return iv.toString("base64") + ":" + encrypted;
  } catch (err: any) {
    console.error("Encryption error:", err.message);
    throw new Error("Token secure encryption failed");
  }
}

/**
 * Decrypt a token or session payload from a secure base64 string.
 */
export function decryptToken(encryptedString: string): string {
  try {
    const ENCRYPTION_KEY = getEncryptionKey();

    const parts = encryptedString.split(":");

    if (parts.length !== 2) {
      throw new Error("Invalid token format");
    }

    const iv = Buffer.from(parts[0], "base64");
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      ENCRYPTION_KEY,
      iv
    );

    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: any) {
    console.error("Decryption error:", err.message);
    throw new Error("Invalid or corrupted encrypted session token");
  }
}

/**
 * Securely sanitizes personally identifiable information (PII) from strings or structured chat history/profiles.
 * Scrubs:
 * - Phone numbers (e.g. +1 555-0199, (555) 012-3498, etc.)
 * - Street addresses (e.g. 1204 Pine Rd, Apt 12, Seattle, WA)
 * - Identifiers (SSNs, Passports, National Identification, Licenses)
 */
export function sanitizeUserProfile(input: string): string;
export function sanitizeUserProfile(input: any[]): any[];
export function sanitizeUserProfile(input: any): any {
  if (!input) return input;

  if (typeof input === "string") {
    let sanitized = input;

    // 1. Phone numbers matching standard international or local shapes
    // Matches patterns like +1 (555) 123-4567, 555-123-4567, 555.123.4567, etc.
    const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    sanitized = sanitized.replace(phoneRegex, "[REDACTED_PHONE]");

    // 2. Specific identification references (SSN: xxx-xx-xxxx, Passport, etc.)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    sanitized = sanitized.replace(ssnRegex, "[REDACTED_SSN]");

    // Generic identification matches: E.g., ID: 123456789 or Passport: XYZ78912
    const genericIdLabelRegex = /\b(?:passport|ssn|national[-_\s]?id|id[-_\s]?card|identification|license)[:\s]+([A-Za-z0-9-]{6,20})\b/gi;
    sanitized = sanitized.replace(genericIdLabelRegex, (match, p1) => {
      return match.replace(p1, "[REDACTED_ID]");
    });

    const nakedIdRegex = /\b\d{9,12}\b/g; // 9-12 digits naked identifier
    sanitized = sanitized.replace(nakedIdRegex, "[REDACTED_ID]");

    // 3. Exact residential / street addresses
    // Matches e.g., "1234 N Main St", "100 Broadway Ave", etc., with potential apartment indicators
    const addressRegex = /\b\d{1,5}\s+(?:[A-Za-z0-9.#\-\s]{2,40})\s+(?:Avenue|Ave|Street|St|Road|Rd|Highway|Hwy|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Cir|Way|Place|Pl)\b/gi;
    sanitized = sanitized.replace(addressRegex, "[REDACTED_ADDRESS]");

    // Exact zip/postal codes associated with redacted addresses
    const zipRegex = /\b\d{5}(?:-\d{4})?\b/g;
    sanitized = sanitized.replace(zipRegex, "[REDACTED_ZIP]");

    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (item && typeof item === "object") {
        const cloned = { ...item };
        for (const key of Object.keys(cloned)) {
          cloned[key] = sanitizeUserProfile(cloned[key]);
        }
        return cloned;
      }
      return sanitizeUserProfile(item);
    });
  }

  if (typeof input === "object") {
    const cloned = { ...input };
    for (const key of Object.keys(cloned)) {
      cloned[key] = sanitizeUserProfile(cloned[key]);
    }
    return cloned;
  }

  return input;
}

/**
 * Middleware to enforce session token presence and integrity prior to executing AI operations.
 * Validates request headers for a valid decrypted authorization token.
 */
export function validateSessionHeader(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const sessionHeader = req.headers["x-session-token"] || req.headers["x-workspace-token"];

    // Permit authorization headers (Bearer tokens) or custom session tokens
    const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : (sessionHeader as string);

    if (!rawToken) {
       res.status(401).json({
        success: false,
        error: "Authorized session is required. Missing secure authorization headers or encrypted session token.",
      });
       return;
    }

    // SECURITY: Only accept encrypted session tokens.
    // If token cannot be decrypted, reject the request.
    // NOTE: Google OAuth tokens for Workspace APIs should be validated via explicit backend logic,
    // not by this session middleware.
    if (!rawToken.includes(":")) {
      res.status(401).json({
        success: false,
        error: "Invalid session token format. Encrypted token expected.",
      });
      return;
    }

    try {
      const decrypted = decryptToken(rawToken);
      if (!decrypted) {
        res.status(401).json({
          success: false,
          error: "Invalid session token.",
        });
        return;
      }
      (req as any).sessionPayload = decrypted;
      next();
    } catch (decryptErr: any) {
      res.status(401).json({
        success: false,
        error: "Session token decryption failed.",
        details: decryptErr?.message || String(decryptErr)
      });
    }
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: "Validation of encrypted session token failed",
      details: error.message
    });
  }
}

/**
 * Helper to log metadata or inputs safely without exposing raw user values.
 */
export function secureLog(message: string, rawData: any): void {
  // Never log raw unmasked client data. Sanitize and log securely
  const sanitized = sanitizeUserProfile(JSON.stringify(rawData));
  console.log(`[SECURE LOG] ${message}:`, sanitized);
}
