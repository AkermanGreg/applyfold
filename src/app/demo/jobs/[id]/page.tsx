import { notFound } from "next/navigation";

import { DemoJob } from "@/components/demo/demo-pages";
import { DEMO_JOBS } from "@/lib/demo/fixtures";

export function generateStaticParams() {
  return DEMO_JOBS.map((job) => ({ id: job.jobId }));
}

export default async function DemoJobPage({ params }: PageProps<"/demo/jobs/[id]">) {
  const { id } = await params;
  if (!DEMO_JOBS.some((job) => job.jobId === id)) notFound();
  return <DemoJob jobId={id} />;
}
