import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Re-reads the role from the database on every call (rather than trusting the
// signed cookie's claim) so a demotion/deactivation takes effect immediately
// instead of waiting out the session's 7-day expiry.
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    redirect("/login");
  }
  return { userId: user.id, email: user.email, name: user.name, role: user.role };
});

// Not just a UI guard: every manager-only server action and page calls this,
// so authorization is enforced on the server for every request rather than
// relying on the client to hide a button (see: the prototype's client-side PIN).
export async function requireManager() {
  const session = await verifySession();
  if (session.role !== "MANAGER") {
    redirect("/report/new");
  }
  return session;
}
