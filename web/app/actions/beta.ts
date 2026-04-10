"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function submitBetaCode(prevState: unknown, formData: FormData) {
  const code = (formData.get("code") as string)?.trim();
  const next = (formData.get("next") as string) || "/login";

  if (!code) return { error: "Enter the access code." };

  if (code !== process.env.BETA_ACCESS_CODE) {
    return { error: "Incorrect code." };
  }

  const cookieStore = await cookies();
  cookieStore.set("x-beta-access", process.env.BETA_ACCESS_CODE!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  redirect(next);
}
