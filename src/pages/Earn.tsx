import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Gift, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { appHead } from "@/lib/app-head";

export const Route = createFileRoute("/earn")({
  head: () => appHead("Earn", "Complete offers, surveys, and tasks to earn rewards."),
  component: () => (
    <AppShell>
      <Earn />
    </AppShell>
  ),
});

function Earn() {
  return (
    <div className="space-y-6">
      {/* MyLead Offerwall */}
      <div className="mb-6 rounded-2xl border border-loot-orange/30 bg-gradient-to-br from-loot-card to-loot-dark p-6 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-loot-orange/15">
            <Gift className="h-8 w-8 text-loot-orange" />
          </div>
        </div>
        <h2 className="font-display text-xl font-bold text-white">
          Complete Offers & Surveys
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Choose from hundreds of offers, surveys, and app installs to earn points.
        </p>
        <a
          href="https://reward-me.eu/b1334694-c8d4-11f1-a264-8a5fb7be40ea"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-loot-orange py-3.5 font-bold text-black"
        >
          <ExternalLink className="h-5 w-5" />
          Open Offerwall
        </a>
        <p className="mt-3 text-center text-[11px] text-gray-600">
          Powered by MyLead
        </p>
      </div>

      {/* OfferToro */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-loot-border bg-gradient-to-br from-loot-card to-loot-dark p-6 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-loot-orange/15">
            <Sparkles className="h-8 w-8 text-loot-orange" />
          </div>
        </div>
        <h2 className="font-display text-xl font-bold text-white">OfferToro</h2>
        <p className="mt-2 text-sm text-gray-400">
          Complete offers and surveys to earn cash rewards.
        </p>
        <a
          href="https://offertoro.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-loot-orange py-3.5 font-bold text-black"
        >
          <ExternalLink className="h-5 w-5" />
          Open Offers
        </a>
        <p className="mt-3 text-center text-[11px] text-gray-600">
          Offers provided by OfferToro
        </p>
      </div>
    </div>
  );
}
