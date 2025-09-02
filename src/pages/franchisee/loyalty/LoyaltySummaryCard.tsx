// src/components/loyalty/LoyaltySummaryCard.tsx
import type { LoyaltyCard } from "@drivn-cook/shared";

const tierClasses: Record<LoyaltyCard["tier"], string> = {
  BASIC: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 border-zinc-300",
  SILVER: "bg-slate-100 dark:bg-slate-800 text-slate-700 border-slate-300",
  GOLD: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 border-yellow-300",
};

export default function LoyaltySummaryCard({ card }: { card: LoyaltyCard }) {
  return (
    <div className="rounded-2xl border p-5 shadow-sm bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Loyalty Card</h2>
          <p className="text-sm text-zinc-500">Card #{card.cardNumber}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm border ${tierClasses[card.tier]}`}>
          {card.tier}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500">Points</p>
          <p className="text-2xl font-bold">{card.points}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
          <p className="text-sm text-zinc-500">Created</p>
          <p className="text-lg">{new Date(card.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-5">
        {card.printablePdfUrl ? (
          <a
            href={card.printablePdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-xl border hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            🖨️ Imprimer la carte (PDF)
          </a>
        ) : (
          <div className="text-sm text-zinc-500">Aucun PDF de carte disponible.</div>
        )}
      </div>
    </div>
  );
}
