import { NextResponse } from "next/server";

// TEMPORARY diagnostic route — reports only whether expected env vars are
// present (never their values), to debug a deployment where the app can't
// find variables the Vercel dashboard shows as configured. Delete this file
// once the deployment issue is resolved.
export async function GET() {
  return NextResponse.json({
    vercelEnv: process.env.VERCEL_ENV ?? null,
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    sessionSecretLength: process.env.SESSION_SECRET?.length ?? 0,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlHost: (() => {
      try {
        return process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : null;
      } catch {
        return "unparseable";
      }
    })(),
  });
}
