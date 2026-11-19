// WhatsApp order alerts with Baileys, built for Vercel (serverless).
//
// Nothing stays connected. The session lives in Supabase; whenever there is
// something to send (new order, customer update, test), the server:
//   1. takes a lock (only one connection at a time),
//   2. loads the session and connects (a few seconds),
//   3. sends the messages,
//   4. saves the updated session keys and disconnects.
// Linking (QR / pairing code) also runs inside one request of up to ~55 s.
//
// SERVER ONLY. Baileys is an unofficial WhatsApp Web client: keep messages
// low-volume and transactional to avoid the number being banned.

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
} from "baileys";
import pino from "pino";
import QRCode from "qrcode";
import { SITE, formatPrice } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearSupabaseAuthState, loadSupabaseAuthState } from "./auth-store";

type Socket = ReturnType<typeof makeWASocket>;

export type WhatsAppStatus = "disconnected" | "connecting" | "qr" | "pairing" | "connected";

export type WhatsAppSettings = { notifyNumber: string; orderAlerts: boolean; messageCustomers: boolean };

export type WhatsAppEvent = { at: string; kind: "info" | "order" | "status" | "error"; text: string };

export type WhatsAppSnapshot = {
  status: WhatsAppStatus;
  qrDataUrl: string | null;
  pairingCode: string | null;
  account: { number: string; name: string | null } | null;
  connectedAt: string | null;
  lastError: string | null;
  settings: WhatsAppSettings;
  events: WhatsAppEvent[];
};

const logger = pino({ level: "silent" });
// Time to scan, plus a reserve after a successful scan for WhatsApp's
// "restart required" reconnect. Together they stay under the route's 60 s.
const LINK_TIMEOUT_MS = 44_000;
const AFTER_SCAN_RESERVE_MS = 12_000;
const CONNECT_TIMEOUT_MS = 25_000;
const LOCK_SECONDS = 60;

// ---------- small helpers ----------

/** 0300-1234567 / +92 300 1234567 → 923001234567 ("" if empty). */
export function toIntl(input: string) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "92" + digits.slice(1);
  return digits;
}

const toJid = (intl: string) => `${intl}@s.whatsapp.net`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statusCodeOf = (error: unknown) =>
  (error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;

type SettingsRow = {
  notify_number: string;
  order_alerts: boolean;
  message_customers: boolean;
  status: WhatsAppStatus;
  qr: string | null;
  pairing_code: string | null;
  account_number: string | null;
  account_name: string | null;
  connected_at: string | null;
  last_error: string | null;
  link_token: string | null;
};

async function readSettings(db: SupabaseClient): Promise<SettingsRow> {
  const { data, error } = await db.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`WhatsApp tables are missing. Run supabase/whatsapp.sql in Supabase. (${error.message})`);
  if (data) return data as SettingsRow;
  await db.from("whatsapp_settings").insert({ id: 1 });
  return (await db.from("whatsapp_settings").select("*").eq("id", 1).single()).data as SettingsRow;
}

async function patchSettings(db: SupabaseClient, patch: Partial<SettingsRow> & Record<string, unknown>) {
  await db.from("whatsapp_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
}

export async function logEvent(db: SupabaseClient, kind: WhatsAppEvent["kind"], message: string) {
  console.log(`[whatsapp] ${message}`);
  await db.from("whatsapp_events").insert({ kind, message });
}

async function withLock<T>(db: SupabaseClient, work: () => Promise<T>, waitMs = 40_000): Promise<T | null> {
  const deadline = Date.now() + waitMs;
  while (true) {
    const { data } = await db.rpc("whatsapp_try_lock", { p_seconds: LOCK_SECONDS });
    if (data === true) break;
    if (Date.now() > deadline) return null;
    await sleep(2_500);
  }
  try {
    return await work();
  } finally {
    await db.from("whatsapp_settings").update({ busy_until: null }).eq("id", 1);
  }
}

let cachedVersion: [number, number, number] | undefined;
async function waVersion() {
  if (!cachedVersion) {
    cachedVersion = await fetchLatestBaileysVersion()
      .then((r) => r.version)
      .catch(() => undefined);
  }
  return cachedVersion;
}

function createSocket(auth: Awaited<ReturnType<typeof loadSupabaseAuthState>>["state"], version?: [number, number, number]) {
  return makeWASocket({
    auth: { creds: auth.creds, keys: makeCacheableSignalKeyStore(auth.keys, logger) },
    version,
    logger,
    browser: Browsers.windows(`${SITE.name} Admin`),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: CONNECT_TIMEOUT_MS,
  });
}

/** Connect with the saved session, run `work`, save keys, disconnect. */
async function withConnection<T>(db: SupabaseClient, work: (sock: Socket) => Promise<T>): Promise<T> {
  const auth = await loadSupabaseAuthState(db);
  if (!auth.isLinked()) throw new Error("WhatsApp is not connected. Link it on the WhatsApp page.");

  const sock = createSocket(auth.state, await waVersion());
  let loggedOut = false;
  sock.ev.on("creds.update", () => {
    if (!loggedOut) void auth.saveCreds();
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("WhatsApp took too long to connect.")), CONNECT_TIMEOUT_MS);
      sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          clearTimeout(timer);
          resolve();
        } else if (connection === "close") {
          clearTimeout(timer);
          const code = statusCodeOf(lastDisconnect?.error);
          reject(Object.assign(new Error(code === DisconnectReason.loggedOut ? "LOGGED_OUT" : `Connection closed (${code ?? "network"})`), { code }));
        }
      });
    });

    const result = await work(sock);
    await sleep(2_000); // let WhatsApp acknowledge and the session keys update
    return result;
  } catch (error) {
    if ((error as Error).message === "LOGGED_OUT") {
      loggedOut = true;
      await auth.flush();
      await clearSupabaseAuthState(db);
      await patchSettings(db, { status: "disconnected", account_number: null, account_name: null, connected_at: null, last_error: "WhatsApp was logged out from the phone. Connect again." });
      throw new Error("WhatsApp was logged out from the phone. Connect it again on the WhatsApp page.");
    }
    throw error;
  } finally {
    if (!loggedOut) await auth.saveCreds();
    await auth.flush();
    try {
      sock.end(undefined);
    } catch {
      // already closed
    }
  }
}

// ---------- order messages ----------

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  created_at: string;
  order_items?: { product_name: string; unit_price: number; quantity: number }[];
};

function siteUrl() {
  const url = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

function ownerMessage(order: OrderRow) {
  const items = (order.order_items ?? [])
    .map((i) => `• ${i.product_name} × ${i.quantity} = ${formatPrice(i.unit_price * i.quantity)}`)
    .join("\n");
  return [
    `🛍️ *New order: ${order.order_number}*`,
    "",
    `👤 ${order.customer_name}`,
    `📞 ${order.phone}`,
    `📍 ${order.address}, *${order.city}*`,
    order.email ? `✉️ ${order.email}` : null,
    "",
    items,
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Delivery: ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}`,
    `*Total (Cash on Delivery): ${formatPrice(order.total)}*`,
    order.notes ? `\n📝 Note: ${order.notes}` : null,
    "",
    `💬 Chat with customer: https://wa.me/${toIntl(order.phone)}`,
    `✅ Confirm / manage: ${siteUrl()}/admin/orders/${order.id}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function customerMessage(order: Pick<OrderRow, "customer_name" | "order_number" | "total">, kind: "received" | "confirmed" | "shipped") {
  return {
    received: `Assalam o Alaikum ${order.customer_name}! ${SITE.name} par aap ka order *${order.order_number}* mil gaya hai. Total: ${formatPrice(order.total)} (Cash on Delivery). Hum jald aap se confirm karenge. Shukriya! 🌸`,
    confirmed: `${order.customer_name}, aap ka order *${order.order_number}* confirm ho gaya hai ✅. 2–5 working days mein deliver ho jayega. ${SITE.name}`,
    shipped: `${order.customer_name}, aap ka order *${order.order_number}* ship ho gaya hai 🚚. Delivery par ${formatPrice(order.total)} ada karein. ${SITE.name}`,
  }[kind];
}

function ownerJid(settings: SettingsRow, sock: Socket) {
  return settings.notify_number ? toJid(settings.notify_number) : jidNormalizedUser(sock.user!.id);
}

/**
 * Sends every order that hasn't been sent yet. Called (via after()) when a
 * customer places an order; safe to call repeatedly.
 */
export async function notifyPendingOrders() {
  const db = createAdminClient();
  const settings = await readSettings(db);
  if (settings.status !== "connected" || !settings.connected_at) return;
  if (!settings.order_alerts && !settings.message_customers) return;

  const findPending = async () => {
    const { data, error } = await db
      .from("orders")
      .select("*, order_items(product_name, unit_price, quantity)")
      .is("whatsapp_notified_at", null)
      .gte("created_at", settings.connected_at!)
      .order("created_at", { ascending: true })
      .limit(10);
    if (error) throw new Error(error.message);
    return (data ?? []) as OrderRow[];
  };

  if ((await findPending()).length === 0) return;

  try {
    const done = await withLock(db, async () => {
      const orders = await findPending(); // another request may have sent them meanwhile
      if (orders.length === 0) return;
      await withConnection(db, async (sock) => {
        for (const order of orders) {
          if (settings.order_alerts) await sock.sendMessage(ownerJid(settings, sock), { text: ownerMessage(order) });
          if (settings.message_customers && toIntl(order.phone)) {
            await sock.sendMessage(toJid(toIntl(order.phone)), { text: customerMessage(order, "received") }).catch(() => {});
          }
          await db.from("orders").update({ whatsapp_notified_at: new Date().toISOString() }).eq("id", order.id);
          await logEvent(db, "order", `Order ${order.order_number} (${formatPrice(order.total)}) sent to WhatsApp.`);
          await sleep(800);
        }
      });
    });
    if (done === null) await logEvent(db, "error", "WhatsApp was busy; the order will be sent with the next one.");
  } catch (error) {
    await logEvent(db, "error", `Order alert failed: ${(error as Error).message}`);
  }
}

/** Customer update after the admin confirms or ships an order (if enabled). */
export async function notifyCustomerStatus(orderId: string, status: string) {
  if (status !== "confirmed" && status !== "shipped") return;
  const db = createAdminClient();
  const settings = await readSettings(db);
  if (settings.status !== "connected" || !settings.message_customers) return;

  const { data: order } = await db.from("orders").select("customer_name, order_number, total, phone").eq("id", orderId).maybeSingle();
  const intl = toIntl(order?.phone ?? "");
  if (!order || !intl) return;

  try {
    await withLock(db, () =>
      withConnection(db, async (sock) => {
        await sock.sendMessage(toJid(intl), { text: customerMessage(order, status) });
      }),
    );
    await logEvent(db, "status", `Customer told: ${order.order_number} is ${status}.`);
  } catch (error) {
    await logEvent(db, "error", `Customer update failed: ${(error as Error).message}`);
  }
}

export async function sendTestMessage() {
  const db = createAdminClient();
  const settings = await readSettings(db);
  const sent = await withLock(db, () =>
    withConnection(db, async (sock) => {
      await sock.sendMessage(ownerJid(settings, sock), {
        text: `✅ *${SITE.name}*: WhatsApp is connected.\nNew orders will arrive here.`,
      });
    }),
  );
  if (sent === null) throw new Error("WhatsApp is busy sending another message. Try again in a few seconds.");
  await logEvent(db, "info", "Test message sent.");
}

// ---------- linking (QR / pairing code) ----------

/**
 * Runs the whole linking flow inside one request (≤ 55 s): shows a QR code
 * (or pairing code) through whatsapp_settings, waits for the scan, saves the
 * session and disconnects. The admin page polls the settings row meanwhile.
 */
export async function linkDevice(pairingNumber?: string) {
  const db = createAdminClient();
  const token = randomUUID();
  await clearSupabaseAuthState(db);
  await patchSettings(db, {
    status: "connecting",
    qr: null,
    pairing_code: null,
    last_error: null,
    link_token: token,
    account_number: null,
    account_name: null,
    connected_at: null,
  });

  const stillOurs = async () => (await readSettings(db)).link_token === token;
  let deadline = Date.now() + LINK_TIMEOUT_MS;
  let pairingRequested = false;

  // WhatsApp asks for one reconnect right after a successful scan ("restart required").
  for (let attempt = 0; attempt < 3; attempt++) {
    const auth = await loadSupabaseAuthState(db);
    const sock = createSocket(auth.state, await waVersion());
    sock.ev.on("creds.update", () => void auth.saveCreds());

    const outcome = await new Promise<"open" | "restart" | "failed" | "cancelled" | "timeout">((resolve) => {
      const finish = (value: "open" | "restart" | "failed" | "cancelled" | "timeout") => {
        clearInterval(watch);
        resolve(value);
      };
      const watch = setInterval(async () => {
        if (Date.now() > deadline) finish("timeout");
        else if (!(await stillOurs())) finish("cancelled");
      }, 3_000);

      sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          if (pairingNumber) {
            if (!pairingRequested) {
              pairingRequested = true;
              try {
                const code = await sock.requestPairingCode(pairingNumber);
                await patchSettings(db, { status: "pairing", pairing_code: code.match(/.{1,4}/g)?.join("-") ?? code });
              } catch {
                await patchSettings(db, { last_error: "Could not get a pairing code. Check the number and try again." });
                finish("failed");
              }
            }
          } else {
            // Low error correction = fewer, bigger squares, which phones read far more easily from a screen.
            const image = await QRCode.toDataURL(qr, { width: 560, margin: 3, errorCorrectionLevel: "L" });
            await patchSettings(db, { status: "qr", qr: image });
          }
        }
        if (connection === "open") finish("open");
        if (connection === "close") {
          finish(statusCodeOf(lastDisconnect?.error) === DisconnectReason.restartRequired ? "restart" : "failed");
        }
      });
    });

    if (outcome === "open") {
      const user = sock.user!;
      await sleep(1_500);
      await auth.saveCreds();
      await auth.flush();
      sock.end(undefined);
      await patchSettings(db, {
        status: "connected",
        qr: null,
        pairing_code: null,
        link_token: null,
        last_error: null,
        account_number: jidNormalizedUser(user.id).split("@")[0],
        account_name: user.name ?? user.notify ?? null,
        connected_at: new Date().toISOString(),
      });
      await logEvent(db, "info", `WhatsApp linked: +${jidNormalizedUser(user.id).split("@")[0]}.`);
      return;
    }

    await auth.saveCreds();
    await auth.flush();
    try {
      sock.end(undefined);
    } catch {
      // already closed
    }

    if (outcome === "restart") {
      // The phone accepted the scan; give the final reconnect time to finish.
      deadline = Math.max(deadline, Date.now() + AFTER_SCAN_RESERVE_MS);
      await patchSettings(db, { status: "connecting", qr: null });
      continue;
    }
    if (outcome === "cancelled") return;

    await clearSupabaseAuthState(db);
    const current = await readSettings(db);
    await patchSettings(db, {
      status: "disconnected",
      qr: null,
      pairing_code: null,
      link_token: null,
      last_error:
        current.last_error ??
        (outcome === "timeout"
          ? "The code expired before it was scanned. Click “Connect WhatsApp” to try again."
          : "WhatsApp closed the connection. Please try again."),
    });
    return;
  }
}

export async function cancelLinking() {
  const db = createAdminClient();
  const settings = await readSettings(db);
  if (settings.status === "connected") return;
  await patchSettings(db, { status: "disconnected", qr: null, pairing_code: null, link_token: null });
}

/** Unlink from WhatsApp (best effort) and delete the session. */
export async function unlinkDevice() {
  const db = createAdminClient();
  try {
    await withLock(db, () => withConnection(db, (sock) => sock.logout()), 10_000);
  } catch {
    // Session may already be invalid; we still delete it below.
  }
  await clearSupabaseAuthState(db);
  await patchSettings(db, {
    status: "disconnected",
    qr: null,
    pairing_code: null,
    link_token: null,
    account_number: null,
    account_name: null,
    connected_at: null,
    last_error: null,
  });
  await logEvent(db, "info", "WhatsApp disconnected and session removed.");
}

// ---------- admin page ----------

export async function getSnapshot(): Promise<WhatsAppSnapshot> {
  const db = createAdminClient();
  const [settings, { data: events }] = await Promise.all([
    readSettings(db),
    db.from("whatsapp_events").select("created_at, kind, message").order("created_at", { ascending: false }).limit(30),
  ]);
  return {
    status: settings.status,
    qrDataUrl: settings.status === "qr" ? settings.qr : null,
    pairingCode: settings.status === "pairing" ? settings.pairing_code : null,
    account:
      settings.status === "connected" && settings.account_number
        ? { number: settings.account_number, name: settings.account_name }
        : null,
    connectedAt: settings.connected_at,
    lastError: settings.last_error,
    settings: {
      notifyNumber: settings.notify_number,
      orderAlerts: settings.order_alerts,
      messageCustomers: settings.message_customers,
    },
    events: (events ?? []).map((e) => ({ at: e.created_at, kind: e.kind, text: e.message })),
  };
}

export async function saveSettings(settings: WhatsAppSettings) {
  const db = createAdminClient();
  await patchSettings(db, {
    notify_number: toIntl(settings.notifyNumber),
    order_alerts: settings.orderAlerts,
    message_customers: settings.messageCustomers,
  });
  await logEvent(db, "info", "Settings saved.");
}
