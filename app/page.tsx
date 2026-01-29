import { redirect } from "next/navigation";

export default function Home() {
  // Always redirect to login (or admin dashboard if we checked session)
  // For safety/simplicity, sending to login is best; the middleware will handle the rest.
  redirect("/login");
}
