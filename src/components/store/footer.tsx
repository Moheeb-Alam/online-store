import Link from "next/link";
import { SITE } from "@/lib/config";

export function StoreFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-[2fr_1fr_1fr] lg:px-24">
        <div>
          <p className="font-display text-[30px] font-bold tracking-tight">
            {SITE.name}
            <span className="text-lime">.</span>
          </p>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/60">{SITE.slogan}</p>
        </div>

        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-white/50">Shop</p>
          <ul className="mt-5 space-y-3 text-[15px] font-medium text-white/85">
            <li><Link href="/shop?sort=newest" className="hover:text-white">New arrivals</Link></li>
            <li><Link href="/shop" className="hover:text-white">Best sellers</Link></li>
            <li><Link href="/shop?sale=1" className="hover:text-white">Sale</Link></li>
            <li><Link href="/shop" className="hover:text-white">All products</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-white/50">Get in touch</p>
          <ul className="mt-5 space-y-3 text-[15px] font-medium text-white/85">
            <li className="flex gap-2"><span className="text-red-500" aria-hidden="true">📞</span>{SITE.phone}</li>
            <li>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-white">
                <span aria-hidden="true">💬</span>WhatsApp
              </a>
            </li>
            <li className="flex gap-2 break-all"><span aria-hidden="true">✉️</span>{SITE.email}</li>
            <li><Link href="/track" className="hover:text-white">Track your order</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-6 text-[13px] text-white/55 sm:flex-row sm:px-6 lg:px-24">
          <p>© {SITE.name}. All rights reserved.</p>
          <p>PKR Rs · Pakistan · English</p>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href={`https://wa.me/${SITE.whatsapp}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/20 transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
    </a>
  );
}
