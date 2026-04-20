import { redirect } from "next/navigation";

function HomePage() {
  redirect("/dashboard");
}

export { HomePage as default };
