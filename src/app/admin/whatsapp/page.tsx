import type { Metadata } from "next";
import { requireAdminDb } from "@/lib/admin-session";
import { getSnapshot } from "@/lib/whatsapp/whatsapp";
import { PageHeader } from "../_components/ui";
import { WhatsAppPanel } from "./whatsapp-panel";

export const metadata: Metadata = { title: "WhatsApp" };

// "Send test message" and "Disconnect" open a short WhatsApp connection.
export const maxDuration = 60;

export default async function WhatsAppPage() {
  await requireAdminDb();
  const initial = await getSnapshot().catch(() => null);

  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Get every new order on WhatsApp within seconds of it being placed."
      />
      {initial ? (
        <WhatsAppPanel initial={initial} />
      ) : (
        <div className="adm-card max-w-2xl p-6">
          <p className="font-semibold text-slate-900">One-time setup: create the WhatsApp tables</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
            <li>Open your Supabase project → <strong>SQL Editor</strong> → <strong>New query</strong>.</li>
            <li>
              Paste the contents of <code className="rounded bg-slate-100 px-1">supabase/whatsapp.sql</code> and click{" "}
              <strong>Run</strong>.
            </li>
            <li>Refresh this page.</li>
          </ol>
        </div>
      )}
    </>
  );
}
