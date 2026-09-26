import { JSONFilePreset } from "lowdb/node";
import path from "node:path";
import fs from "node:fs";
import { config } from "./config.js";
import type { User, StoredDocument, Claim, ChatMessage } from "./types.js";

/**
 * Storage layer for the hackathon/demo build.
 *
 * This uses a local JSON file so the app runs with zero external
 * infrastructure. In production, swap this module for a Firestore-backed
 * implementation (see README > "Swapping in Firestore") without changing
 * any route or service code, since everything else only calls the
 * functions exported below.
 */

interface DbSchema {
  users: User[];
  documents: StoredDocument[];
  claims: Claim[];
  chatMessages: ChatMessage[];
}

const defaultData: DbSchema = { users: [], documents: [], claims: [], chatMessages: [] };

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(path.join(config.dataDir, "uploads"), { recursive: true });

const dbPromise = JSONFilePreset<DbSchema>(path.join(config.dataDir, "db.json"), defaultData);

export async function getDb() {
  return dbPromise;
}

// --- Users ---
export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const db = await getDb();
  return db.data.users.find((u) => u.id === id) ?? null;
}

export async function createUser(user: User) {
  const db = await getDb();
  db.data.users.push(user);
  await db.write();
  return user;
}

// --- Documents ---
export async function saveDocument(doc: StoredDocument) {
  const db = await getDb();
  db.data.documents.push(doc);
  await db.write();
  return doc;
}

export async function updateDocument(id: string, patch: Partial<StoredDocument>) {
  const db = await getDb();
  const idx = db.data.documents.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  db.data.documents[idx] = { ...db.data.documents[idx], ...patch };
  await db.write();
  return db.data.documents[idx];
}

export async function getDocumentsByIds(ids: string[]) {
  const db = await getDb();
  return db.data.documents.filter((d) => ids.includes(d.id));
}

export async function getDocumentsByUser(userId: string) {
  const db = await getDb();
  return db.data.documents.filter((d) => d.userId === userId);
}

export async function deleteDocument(id: string, userId: string) {
  const db = await getDb();
  const doc = db.data.documents.find((d) => d.id === id && d.userId === userId);
  if (!doc) return false;
  db.data.documents = db.data.documents.filter((d) => d.id !== id);
  await db.write();
  try {
    fs.unlinkSync(doc.storagePath);
  } catch {
    /* best-effort cleanup */
  }
  return true;
}

// --- Claims ---
export async function saveClaim(claim: Claim) {
  const db = await getDb();
  db.data.claims.push(claim);
  await db.write();
  return claim;
}

export async function updateClaim(id: string, patch: Partial<Claim>) {
  const db = await getDb();
  const idx = db.data.claims.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.data.claims[idx] = { ...db.data.claims[idx], ...patch, updatedAt: new Date().toISOString() };
  await db.write();
  return db.data.claims[idx];
}

export async function getClaimById(id: string) {
  const db = await getDb();
  return db.data.claims.find((c) => c.id === id) ?? null;
}

export async function getClaimsByUser(userId: string) {
  const db = await getDb();
  return db.data.claims.filter((c) => c.userId === userId);
}

export async function getAllClaims() {
  const db = await getDb();
  return db.data.claims;
}

// --- Chat ---
export async function saveChatMessage(msg: ChatMessage) {
  const db = await getDb();
  db.data.chatMessages.push(msg);
  await db.write();
  return msg;
}

export async function getChatHistory(claimId: string) {
  const db = await getDb();
  return db.data.chatMessages.filter((m) => m.claimId === claimId);
}
