import { createFileRoute } from "@tanstack/react-router";
import { StolperApp } from "@/components/stolper-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StolperApp />;
}
