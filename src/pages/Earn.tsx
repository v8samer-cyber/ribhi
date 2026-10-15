import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { appHead } from "@/lib/app-head";

export const Route = createFileRoute("/earn")({
  head: () => appHead("Earn", "Complete offers to earn rewards."),
  component: () => (
    <AppShell>
      <Earn />
    </AppShell>
  ),
});

function Earn() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-white">Earn</h1>
      <a
        href="https://reward-me.eu/b1334694-c8d4-11f1-a264-8a5fb7be40ea"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl bg-orange-500 py-4 text-center font-bold text-black"
      >
        Open Offerwall
      </a>
      <a
        href="https://offertoro.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl bg-orange-500 py-4 text-center font-bold text-black"
      >
        Open OfferToro
      </a>
    </div>
  );
}
