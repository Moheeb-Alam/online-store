"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { formatDateTime } from "@/lib/format";
import type { WhatsAppSnapshot } from "@/lib/whatsapp/whatsapp";
import { IconCheck, IconPhone } from "../_components/icons";
import { Card } from "../_components/ui";
import { cancelWhatsApp, getWhatsAppState, logoutWhatsApp, saveWhatsAppSettings, sendWhatsAppTest } from "./actions";

const WAITING = new Set(["connecting", "qr", "pairing"]);

function WhatsAppLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

function StatusPill({ status }: { status: WhatsAppSnapshot["status"] }) {
  const map = {
    connected: { label: "Connected", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
    connecting: { label: "Starting…", cls: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500 animate-pulse" },
    qr: { label: "Waiting for scan", cls: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500 animate-pulse" },
    pairing: { label: "Waiting for code", cls: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500 animate-pulse" },
    disconnected: { label: "Not connected", cls: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${map.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} aria-hidden="true" />
      {map.label}
    </span>
  );
}

function Toggle({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-emerald-600 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-100" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-700">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function WhatsAppPanel({ initial }: { initial: WhatsAppSnapshot }) {
  const [snap, setSnap] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [usePhone, setUsePhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [settingsState, saveSettings, savingSettings] = useActionState(saveWhatsAppSettings, null);

  const waiting = WAITING.has(snap.status);

  // Live status from Supabase: fast while linking, slower otherwise (activity log).
  useEffect(() => {
    let alive = true;
    const id = setInterval(
      async () => {
        try {
          const next = await getWhatsAppState();
          if (alive) setSnap(next);
        } catch {
          // keep the last known state
        }
      },
      waiting ? 2_000 : 15_000,
    );
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [waiting]);

  /** Linking runs in its own request (up to ~55 s) while this page polls the status. */
  function connect(pairingNumber?: string) {
    setNotice(null);
    setSnap((s) => ({ ...s, status: "connecting", lastError: null }));
    void fetch("/api/admin/whatsapp/link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pairingNumber ? { pairingNumber } : {}),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setNotice({ ok: false, text: body.error ?? "Could not start WhatsApp linking." });
        }
        setSnap(await getWhatsAppState());
      })
      .catch(() => setNotice({ ok: false, text: "Network error while linking WhatsApp." }));
  }

  function run(label: string, action: () => Promise<WhatsAppSnapshot>) {
    setNotice(null);
    setBusy(label);
    startTransition(async () => {
      try {
        setSnap(await action());
      } catch (e) {
        setNotice({ ok: false, text: (e as Error).message || "Something went wrong." });
      } finally {
        setBusy(null);
      }
    });
  }

  function sendTest() {
    setNotice(null);
    setBusy("test");
    startTransition(async () => {
      const result = await sendWhatsAppTest();
      setNotice(
        result.ok
          ? { ok: true, text: "Test message sent. Check your WhatsApp." }
          : { ok: false, text: result.error ?? "Could not send the test message." },
      );
      setSnap(await getWhatsAppState());
      setBusy(null);
    });
  }

  const ownChat = !snap.settings.notifyNumber;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        {/* ---------- Connection ---------- */}
        <Card
          title="Connection"
          description="Link the WhatsApp number that will send you order alerts."
          action={<StatusPill status={snap.status} />}
        >
          {snap.status === "connected" && snap.account && (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                  <WhatsAppLogo className="h-8 w-8" />
                </span>
                <div>
                  <p className="text-lg font-bold text-slate-900">{snap.account.name ?? "WhatsApp"}</p>
                  <p className="text-sm text-slate-500 tabular-nums">+{snap.account.number}</p>
                  {snap.connectedAt && (
                    <p className="mt-0.5 text-xs text-slate-400">Linked on {formatDateTime(snap.connectedAt)}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={sendTest} disabled={pending} className="adm-btn-secondary">
                  {busy === "test" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                      Sending…
                    </>
                  ) : (
                    "Send test message"
                  )}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Disconnect WhatsApp? You will need to scan the QR code again to reconnect.")) {
                      run("logout", logoutWhatsApp);
                    }
                  }}
                  className="adm-btn border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                >
                  {busy === "logout" ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            </div>
          )}

          {snap.status === "disconnected" && (
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <WhatsAppLogo className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">WhatsApp is not connected</p>
                    <p className="text-sm text-slate-500">Link once; it stays linked until you disconnect.</p>
                  </div>
                </div>

                {usePhone && (
                  <form
                    className="mt-5 flex flex-col gap-2 sm:flex-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      connect(phone);
                    }}
                  >
                    <label htmlFor="pair-phone" className="sr-only">WhatsApp number to link</label>
                    <input
                      id="pair-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="WhatsApp number, e.g. 03001234567"
                      className="adm-input sm:max-w-xs"
                    />
                    <button type="submit" className="adm-btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                      Get link code
                    </button>
                  </form>
                )}
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                {!usePhone && (
                  <button
                    type="button"
                    onClick={() => connect()}
                    className="adm-btn bg-emerald-600 px-5 py-2.5 text-white shadow-sm hover:bg-emerald-700"
                  >
                    <WhatsAppLogo className="h-5 w-5" />
                    Connect WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setUsePhone((v) => !v)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  {usePhone ? "Use a QR code instead" : "Link with phone number instead"}
                </button>
              </div>
            </div>
          )}

          {snap.status === "connecting" && (
            <div className="flex items-center gap-3 py-6 text-sm font-medium text-slate-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
              Connecting to WhatsApp… (after a scan this takes a few seconds)
            </div>
          )}

          {snap.status === "qr" && snap.qrDataUrl && (
            <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
              <div className="mx-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={snap.qrDataUrl}
                  alt="WhatsApp QR code"
                  width={300}
                  height={300}
                  className="h-[300px] w-[300px] [image-rendering:pixelated]"
                />
              </div>
              <div>
                <p className="mb-4 font-semibold text-slate-900">Scan with the WhatsApp you want to link</p>
                <Steps
                  items={[
                    "Open WhatsApp on your phone.",
                    <>Tap <strong>Settings</strong> (or ⋮ menu) → <strong>Linked devices</strong>.</>,
                    <>Tap <strong>Link a device</strong> and point your phone at this QR code.</>,
                  ]}
                />
                <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Waiting for scan… you have about 40 seconds. If it expires, click Connect again.
                </p>
                <button type="button" onClick={() => run("cancel", cancelWhatsApp)} disabled={pending} className="adm-btn-secondary mt-4">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {snap.status === "pairing" && snap.pairingCode && (
            <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
              <div className="mx-auto rounded-2xl border border-slate-200 bg-slate-50 px-8 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your code</p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-[0.2em] text-slate-900">{snap.pairingCode}</p>
              </div>
              <div>
                <Steps
                  items={[
                    <>On your phone open WhatsApp → <strong>Linked devices</strong> → <strong>Link a device</strong>.</>,
                    <>Tap <strong>Link with phone number instead</strong>.</>,
                    "Enter the code shown here.",
                  ]}
                />
                <button type="button" onClick={() => run("cancel", cancelWhatsApp)} disabled={pending} className="adm-btn-secondary mt-5">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {snap.lastError && snap.status === "disconnected" && (
            <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{snap.lastError}</p>
          )}
          {notice && (
            <p
              role="status"
              className={`mt-5 rounded-lg px-3 py-2 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
            >
              {notice.text}
            </p>
          )}
        </Card>

        {/* ---------- How it works ---------- */}
        <Card title="How it works" description="Built for Vercel: nothing stays online in the background.">
          <div className="grid gap-6 md:grid-cols-2">
            <Steps
              items={[
                "A customer places an order on the website.",
                <>The server loads your WhatsApp session from Supabase and <strong>connects</strong>.</>,
                <>It sends you the full order, then <strong>disconnects</strong>, usually within 10–15 seconds.</>,
                <>Tap the <strong>Confirm / manage</strong> link in the message to open the order in this dashboard.</>,
              ]}
            />
            <div className="rounded-2xl bg-[#e7f7ee] p-4">
              <div className="max-w-[95%] rounded-xl rounded-tl-sm bg-white p-3 text-[13px] leading-relaxed text-slate-800 shadow-sm">
                <p className="font-bold">🛍️ New order: GU-261119-AB12C</p>
                <p className="mt-1">👤 Ayesha Khan · 📞 03001234567</p>
                <p>📍 House 12, Gulberg, <strong>Lahore</strong></p>
                <p className="mt-1">• Vitamin C Serum × 2 = Rs. 4,900</p>
                <p className="mt-1 font-bold">Total (Cash on Delivery): Rs. 4,900</p>
                <p className="mt-1 text-sky-700">💬 Chat with customer: wa.me/923001234567</p>
                <p className="text-sky-700">✅ Confirm / manage: …/admin/orders/…</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {/* ---------- Settings ---------- */}
        <Card title="Settings">
          <form action={saveSettings} className="space-y-5">
            <div>
              <label htmlFor="notifyNumber" className="adm-label">Send order alerts to</label>
              <div className="relative">
                <IconPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="notifyNumber"
                  name="notifyNumber"
                  type="tel"
                  defaultValue={snap.settings.notifyNumber ? `+${snap.settings.notifyNumber}` : ""}
                  placeholder="Linked number (Message yourself)"
                  className="adm-input pl-9"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {ownChat
                  ? "Empty: orders arrive in the linked WhatsApp's own “Message yourself” chat."
                  : "Order alerts go to this number."}
              </p>
            </div>
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <Toggle
                name="orderAlerts"
                defaultChecked={snap.settings.orderAlerts}
                label="New order alerts"
                hint="Send every new order to WhatsApp."
              />
              <Toggle
                name="messageCustomers"
                defaultChecked={snap.settings.messageCustomers}
                label="Message customers"
                hint={
                  <>
                    Auto-send “order received / confirmed / shipped”.{" "}
                    <span className="text-amber-700">Keep off if your number is new; heavy sending can get it banned.</span>
                  </>
                }
              />
            </div>
            {settingsState && (
              <p
                role="status"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  settingsState.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                }`}
              >
                {settingsState.ok && <IconCheck className="h-4 w-4" />}
                {settingsState.message}
              </p>
            )}
            <button type="submit" disabled={savingSettings} className="adm-btn-primary w-full">
              {savingSettings ? "Saving…" : "Save settings"}
            </button>
          </form>
        </Card>

        {/* ---------- Activity ---------- */}
        <Card title="Activity" description="Latest WhatsApp events" bodyClassName="p-0">
          {snap.events.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {snap.events.map((event, i) => (
                <li key={`${event.at}-${i}`} className="flex gap-3 px-5 py-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      { order: "bg-rose-500", status: "bg-emerald-500", error: "bg-amber-500", info: "bg-slate-300" }[event.kind]
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800">{event.text}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(event.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
