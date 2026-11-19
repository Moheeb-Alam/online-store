"use server";

import { redirect } from "next/navigation";
import { createSession, verifyAdminLogin } from "@/lib/admin-session";

export type LoginState = { error: string } | null;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // Spaces before/after the password usually come from copy-paste or autofill.
  const password = String(formData.get("password") ?? "").trim();
  if (!email || !password) return { error: "Enter your email and password." };

  const adminId = await verifyAdminLogin(email, password);
  if (!adminId && process.env.NODE_ENV === "development") {
    // Local-only hint for failed logins (never logs the password itself).
    console.warn(`[login] failed for email "${email}" (password length ${password.length})`);
  }
  if (!adminId) {
    // Small delay slows down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Wrong email or password. Passwords are case-sensitive (small/capital letters matter)." };
  }

  await createSession(adminId);
  redirect("/admin");
}
