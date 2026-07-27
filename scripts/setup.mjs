#!/usr/bin/env node
// One-command local setup: creates .env if missing, starts a local Postgres
// via Docker (unless .env already points at a real database), applies
// migrations, and seeds the manager account. Safe to re-run.
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const ENV_PATH = ROOT + ".env";
const ENV_EXAMPLE_PATH = ROOT + ".env.example";
const LOCAL_DB_URL = "postgresql://quality:quality@localhost:5432/quality_report";

function log(msg) {
  console.log(`\n➤ ${msg}`);
}

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
}

function parseEnv(text) {
  const env = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

// --- Step 1: make sure .env exists ---
let usingLocalDb = false;
if (!existsSync(ENV_PATH)) {
  log("No .env found — creating one from .env.example");
  copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  let text = readFileSync(ENV_PATH, "utf8");
  text = text.replace('DATABASE_URL=""', `DATABASE_URL="${LOCAL_DB_URL}"`);
  text = text.replace(
    'SESSION_SECRET="replace-with-a-random-base64-string"',
    `SESSION_SECRET="${randomBytes(32).toString("base64")}"`,
  );
  writeFileSync(ENV_PATH, text);
  usingLocalDb = true;
  console.log("  Created .env with a local database URL and a generated session secret.");
} else {
  log(".env already exists — leaving it as-is");
  const env = parseEnv(readFileSync(ENV_PATH, "utf8"));
  usingLocalDb = !env.DATABASE_URL || env.DATABASE_URL === LOCAL_DB_URL;
}

// --- Step 2: start local Postgres via Docker, if we're using the local DB ---
if (usingLocalDb) {
  log("Starting a local Postgres via Docker");
  const dockerCheck = spawnSync("docker", ["--version"], { stdio: "ignore" });
  if (dockerCheck.status !== 0) {
    fail(
      "Docker isn't installed (or isn't running).\n" +
        "  Install Docker Desktop from https://www.docker.com/products/docker-desktop/, start it, then re-run `npm run setup`.\n" +
        "  Or, if you'd rather use a cloud database instead of Docker, put its connection string in DATABASE_URL in .env and re-run this.",
    );
  }
  run("docker compose up -d db");

  log("Waiting for the database to be ready");
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline) {
    const check = spawnSync("docker", ["compose", "exec", "-T", "db", "pg_isready", "-U", "quality", "-d", "quality_report"], {
      cwd: ROOT,
      stdio: "ignore",
    });
    if (check.status === 0) {
      ready = true;
      break;
    }
    execSync("sleep 1");
  }
  if (!ready) fail("Postgres didn't become ready in time. Try `docker compose logs db` to see what's wrong.");
  console.log("  Database is ready.");
} else {
  log("DATABASE_URL in .env points somewhere other than the local Docker default — using that instead of starting Docker.");
}

// --- Step 3: install dependencies if needed ---
if (!existsSync(ROOT + "node_modules")) {
  log("Installing dependencies (npm install)");
  run("npm install");
}

// --- Step 4: migrate + seed ---
log("Applying database migrations");
run("npx prisma migrate deploy");

log("Seeding the manager account");
run("npx prisma db seed");

console.log(`
✓ All set!

  Run:   npm run dev
  Open:  http://localhost:3000/login

  Sign in with the manager account from your .env (MANAGER_EMAIL / MANAGER_PASSWORD),
  default: marcs@beldenae.com / ChangeMe123!
`);
