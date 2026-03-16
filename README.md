import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SETTINGS } from "../config/defaults.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const dataDir = path.join(rootDir, "data");
const meetingsDir = path.join(dataDir, "meetings");
const settingsFile = path.join(dataDir, "settings.json");

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function mergeDeep(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming : base;
  }
  if (!isPlainObject(base)) {
    return incoming ?? base;
  }

  const out = { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (Array.isArray(value)) {
      out[key] = value;
    } else if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = mergeDeep(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDataDirs() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(meetingsDir, { recursive: true });
  if (!(await exists(settingsFile))) {
    await writeFile(settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
  }
}

export async function readSettings() {
  await ensureDataDirs();
  const raw = await readFile(settingsFile, "utf-8");
  const parsed = JSON.parse(raw);
  return mergeDeep(DEFAULT_SETTINGS, parsed);
}

export async function saveSettings(incoming) {
  const current = await readSettings();
  const merged = mergeDeep(current, incoming || {});
  await writeFile(settingsFile, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

export async function createSession({ title, humans = ["사용자"], assistants = [] }) {
  const session = {
    id: crypto.randomUUID(),
    title: title || "새 회의",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
    participants: {
      humans,
      assistants,
    },
    messages: [],
    minutes: {
      draft: null,
      final: null,
      lastGeneratedAt: null,
    },
    ontology: {
      lastSync: null,
    },
  };
  await saveSession(session);
  return session;
}

export async function saveSession(session) {
  await ensureDataDirs();
  session.updatedAt = new Date().toISOString();
  const filePath = path.join(meetingsDir, `${session.id}.json`);
  await writeFile(filePath, JSON.stringify(session, null, 2), "utf-8");
  return session;
}

export async function loadSession(sessionId) {
  const filePath = path.join(meetingsDir, `${sessionId}.json`);
  if (!(await exists(filePath))) return null;
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export async function listSessions() {
  await ensureDataDirs();
  const files = await readdir(meetingsDir);
  const sessions = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(path.join(meetingsDir, file), "utf-8");
    const session = JSON.parse(raw);
    sessions.push({
      id: session.id,
      title: session.title,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages?.length || 0,
    });
  }
  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sessions;
}
