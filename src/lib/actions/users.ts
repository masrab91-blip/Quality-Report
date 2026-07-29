"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/dal";

export type CreateUserState = { error?: string; generatedPassword?: string } | undefined;

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

export async function createUserAction(_prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireManager();

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Only managers have accounts now — submission needs no login at all.
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, role: "MANAGER", passwordHash },
  });

  revalidatePath("/users");
  return { generatedPassword: tempPassword };
}
