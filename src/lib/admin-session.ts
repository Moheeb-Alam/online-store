import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createAdminClient, isAdminConfigured } from "./supabase/admin";

// Admin login sessions, stored in the admin_sessions table.
// The browser gets a random token in an httpOnly cookie; the database only
// keeps its SHA-256 hash, so a leaked table cannot be used to log in.

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

export type Admin = { id: string; email: string };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Checks email + password against admin_users. Returns the admin id or null. */
export async function verifyAdminLogin(email: string, password: string): Promise<string | null> {
  const { data, error } = await createAdminClient().rpc("verify_admin_login", {
    p_email: email,
    p_password: password,
  });
  if (error) throw new Error(`Login check failed: ${error.message}`);
  return (data as string | null) ?? null;
}

export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await createAdminClient().from("admin_sessions").insert({
    token_hash: hashToken(token),
    admin_id: adminId,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(`Could not create session: ${error.message}`);

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in admin, or null. */
export async function getAdmin(): Promise<Admin | null> {
  if (!isAdminConfigured) return null;
  // Session checks must run per request (they compare against the current time).
  await connection();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { data } = await createAdminClient()
    .from("admin_sessions")
    .select("admin_id, expires_at, admin_users(email)")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!data) return null;

  const user = data.admin_users as unknown as { email: string } | null;
  return user ? { id: data.admin_id, email: user.email } : null;
}

/**
 * Use this in every admin page and action: it checks the session first and
 * only then hands out the full-access database client.
 * (Layouts alone are not enough; pages can be requested without them.)
 */
export async function requireAdminDb() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return createAdminClient();
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token && isAdminConfigured) {
    await createAdminClient().from("admin_sessions").delete().eq("token_hash", hashToken(token));
  }
  cookieStore.delete(COOKIE_NAME);
}
