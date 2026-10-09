import { currentUser } from "@clerk/nextjs/server";
import { FileText, Search, Sparkles, SquareKanban } from "lucide-react";

import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

const upcoming = [
  { icon: FileText, title: "Your profile", body: "Upload a resume and review what we extracted." },
  { icon: Search, title: "Job feed", body: "Roles that fit, with a score and a reason for each." },
  { icon: Sparkles, title: "Tailored drafts", body: "Cover letter and answers for any posting, in one click." },
  { icon: SquareKanban, title: "Tracker", body: "Saved, applied, interview, offer: all in one place." },
];

export default async function DashboardPage() {
  await requireUserId();
  const user = await currentUser();
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}.
      </h1>
      <p className="mt-1 text-muted-foreground">Your workspace is being set up. Here’s what’s coming next.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {upcoming.map((item) => (
          <li key={item.title} className="flex gap-4 rounded-xl border border-dashed p-5">
            <item.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-medium">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
