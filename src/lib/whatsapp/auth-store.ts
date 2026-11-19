// Baileys auth state stored in Supabase (table whatsapp_auth) instead of files,
// so a short-lived serverless function can reuse the linked WhatsApp session.
// Mirrors Baileys' useMultiFileAuthState: one row per key, JSON with BufferJSON.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationCreds,
  type SignalDataTypeMap,
  type SignalKeyStore,
} from "baileys";

const TABLE = "whatsapp_auth";
const CREDS_KEY = "creds";

const encode = (value: unknown) => JSON.stringify(value, BufferJSON.replacer);
const decode = (text: string) => JSON.parse(text, BufferJSON.reviver);

export async function loadSupabaseAuthState(db: SupabaseClient) {
  const pending = new Set<Promise<unknown>>();
  const track = <T>(promise: Promise<T>) => {
    pending.add(promise);
    void promise.finally(() => pending.delete(promise));
    return promise;
  };

  const { data: credsRow, error } = await db.from(TABLE).select("value").eq("key", CREDS_KEY).maybeSingle();
  if (error) throw new Error(`Could not load WhatsApp session: ${error.message}`);
  const creds: AuthenticationCreds = credsRow ? decode(credsRow.value) : initAuthCreds();

  const keys: SignalKeyStore = {
    async get(type, ids) {
      const result: { [id: string]: SignalDataTypeMap[typeof type] } = {};
      if (ids.length === 0) return result;
      const { data, error: readError } = await db
        .from(TABLE)
        .select("key,value")
        .in("key", ids.map((id) => `${type}-${id}`));
      if (readError) throw new Error(`Could not read WhatsApp keys: ${readError.message}`);
      const byKey = new Map((data ?? []).map((row) => [row.key as string, row.value as string]));
      for (const id of ids) {
        const raw = byKey.get(`${type}-${id}`);
        if (!raw) continue;
        let value = decode(raw);
        if (type === "app-state-sync-key" && value) {
          value = proto.Message.AppStateSyncKeyData.fromObject(value);
        }
        result[id] = value;
      }
      return result;
    },

    async set(data) {
      const upserts: { key: string; value: string; updated_at: string }[] = [];
      const deletes: string[] = [];
      const now = new Date().toISOString();
      for (const category in data) {
        const entries = data[category as keyof typeof data] ?? {};
        for (const id in entries) {
          const value = entries[id];
          const key = `${category}-${id}`;
          if (value) upserts.push({ key, value: encode(value), updated_at: now });
          else deletes.push(key);
        }
      }
      const tasks: Promise<unknown>[] = [];
      if (upserts.length) tasks.push(track(Promise.resolve(db.from(TABLE).upsert(upserts))));
      if (deletes.length) tasks.push(track(Promise.resolve(db.from(TABLE).delete().in("key", deletes))));
      await Promise.all(tasks);
    },
  };

  return {
    state: { creds, keys },
    /** Save the main credentials (call on every "creds.update"). */
    saveCreds: () =>
      track(
        Promise.resolve(
          db.from(TABLE).upsert({ key: CREDS_KEY, value: encode(creds), updated_at: new Date().toISOString() }),
        ),
      ),
    /** Wait until every pending write has reached Supabase. */
    flush: async () => {
      while (pending.size) await Promise.allSettled([...pending]);
    },
    /** True once a phone has been linked to this session. */
    isLinked: () => Boolean(creds.me?.id),
  };
}

/** Deletes the whole WhatsApp session (unlink). */
export async function clearSupabaseAuthState(db: SupabaseClient) {
  const { error } = await db.from(TABLE).delete().neq("key", "");
  if (error) throw new Error(`Could not clear WhatsApp session: ${error.message}`);
}
