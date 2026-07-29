import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Anyone can submit a report — only a signed-in manager gets sent to the board.
export default async function Home() {
  const session = await getSession();
  redirect(session ? "/board" : "/report/new");
}
