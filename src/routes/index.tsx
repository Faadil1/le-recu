import { createFileRoute } from "@tanstack/react-router";
import { ReceiptApp } from "@/components/receipt-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ReceiptApp />;
}
