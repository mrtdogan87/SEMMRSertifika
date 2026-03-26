import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export default async function HomePage() {
  if (await getCurrentAdmin()) {
    redirect("/panel/sertifikalar");
  }

  redirect("/login");
}
