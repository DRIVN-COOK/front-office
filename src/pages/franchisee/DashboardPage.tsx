// src/pages/franchisee/DashboardPage.tsx
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-neutral-500">Accédez rapidement aux fonctionnalités clés.</p>
      </header>

      {/* Cards grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Commandes */}
        <Link
          to="/franchisée/orders/board"
          className="group rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 shadow-sm p-5 transition flex items-start gap-4"
        >
          <div className="rounded-xl bg-neutral-100 p-3 text-neutral-700 group-hover:bg-neutral-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h12M4 12h10M4 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18 7l-2 4h3l-2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Commandes (temps réel)</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Filtre par défaut sur les commandes en cours. Split immédiates / planifiées.
            </p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-black group-hover:underline">
              Ouvrir
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </div>
        </Link>

        {/* Stock */}
        <Link
          to="/franchisée/stock"
          className="group rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 shadow-sm p-5 transition flex items-start gap-4"
        >
          <div className="rounded-xl bg-neutral-100 p-3 text-neutral-700 group-hover:bg-neutral-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 7l9 5 9-5M3 7v10l9 5 9-5V7" stroke="currentColor" strokeWidth="2" />
              <path d="M12 12v10" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Stocks</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Inventaires entrepôt & camion, quantités disponibles et réservées.
            </p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-black group-hover:underline">
              Ouvrir
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </div>
        </Link>

        {/* Gestion des événements */}
        <div className="group rounded-2xl border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 shadow-sm p-5 transition flex items-start gap-4">
          <div className="rounded-xl bg-neutral-100 p-3 text-neutral-700 group-hover:bg-neutral-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Gestion des événements</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Créer et gérer les événements de présence du camion.
            </p>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <Link
                to="/franchisée/events"
                className="inline-flex items-center gap-1 text-sm font-medium text-black group-hover:underline"
              >
                Event Manager
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" />
                </svg>
              </Link>
              <Link
                to="/franchisée/events/new"
                className="text-sm text-neutral-700 underline hover:text-black"
              >
                Créer un événement
              </Link>
            </div>
          </div>
        </div>

        {/* Placeholder */}
        <div
          aria-disabled
          className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 shadow-sm p-5 flex items-start gap-4"
        >
          <div className="rounded-xl bg-neutral-100 p-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-500">Bloc à définir</h3>
            <p className="text-sm mt-1">Fonctionnalité à venir…</p>
          </div>
        </div>
      </section>
    </div>
  );
}
