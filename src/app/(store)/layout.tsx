import { DemoBanner } from "@/components/demo-banner";
import { CartDrawer } from "@/components/store/cart-drawer";
import { StoreFooter, WhatsAppFloat } from "@/components/store/footer";
import { StoreHeader } from "@/components/store/header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <DemoBanner />
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <CartDrawer />
      <WhatsAppFloat />
    </div>
  );
}
