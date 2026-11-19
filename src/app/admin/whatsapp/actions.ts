"use server";

import { requireAdminDb } from "@/lib/admin-session";
import {
  cancelLinking,
  getSnapshot,
  saveSettings,
  sendTestMessage,
  toIntl,
  unlinkDevice,
  type WhatsAppSnapshot,
} from "@/lib/whatsapp/whatsapp";

// Every action checks the admin session first (redirects to /login if not signed in).
// Connecting itself runs in the route /api/admin/whatsapp/link.

export async function getWhatsAppState(): Promise<WhatsAppSnapshot> {
  await requireAdminDb();
  return getSnapshot();
}

export async function cancelWhatsApp(): Promise<WhatsAppSnapshot> {
  await requireAdminDb();
  await cancelLinking();
  return getSnapshot();
}

export async function logoutWhatsApp(): Promise<WhatsAppSnapshot> {
  await requireAdminDb();
  await unlinkDevice();
  return getSnapshot();
}

export async function sendWhatsAppTest(): Promise<{ ok: boolean; error?: string }> {
  await requireAdminDb();
  try {
    await sendTestMessage();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type SettingsState = { ok: boolean; message: string } | null;

export async function saveWhatsAppSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdminDb();
  const notifyNumber = toIntl(String(formData.get("notifyNumber") ?? ""));
  if (notifyNumber && !/^\d{10,15}$/.test(notifyNumber)) {
    return { ok: false, message: "Enter a valid WhatsApp number, e.g. 03001234567, or leave it empty." };
  }
  await saveSettings({
    notifyNumber,
    orderAlerts: formData.get("orderAlerts") === "on",
    messageCustomers: formData.get("messageCustomers") === "on",
  });
  return { ok: true, message: "Settings saved." };
}
