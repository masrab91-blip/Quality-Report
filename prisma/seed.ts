import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const managerEmail = (process.env.MANAGER_EMAIL ?? "marcs@beldenae.com").toLowerCase();
  const managerPassword = process.env.MANAGER_PASSWORD ?? "ChangeMe123!";
  const managerName = process.env.MANAGER_NAME ?? "Marc";

  const passwordHash = await bcrypt.hash(managerPassword, 12);
  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: { email: managerEmail, passwordHash, name: managerName, role: "MANAGER" },
  });
  console.log(`Manager user ready: ${manager.email}`);

  await prisma.counter.upsert({
    where: { id: "report" },
    update: {},
    create: { id: "report", value: 0 },
  });
  console.log("Report number counter ready.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
