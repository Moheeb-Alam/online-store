import { getAdmin } from "@/lib/admin-session";
import { linkDevice, toIntl } from "@/lib/whatsapp/whatsapp";

// Linking keeps one connection open while the admin scans the QR code.
export const maxDuration = 60;

/** Starts WhatsApp linking. The admin page polls the status meanwhile. */
export async function POST(request: Request) {
  if (!(await getAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { pairingNumber?: string };
  const pairingNumber = body.pairingNumber ? toIntl(body.pairingNumber) : undefined;
  if (body.pairingNumber && !/^\d{10,15}$/.test(pairingNumber ?? "")) {
    return Response.json({ error: "Enter the WhatsApp number, e.g. 03001234567." }, { status: 400 });
  }

  try {
    await linkDevice(pairingNumber);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
