import { redirect } from "next/navigation";

/** Workspace entry — the Stitch shell starts at Repositories. */
export default function RootPage(): never {
  redirect("/repositories");
}
