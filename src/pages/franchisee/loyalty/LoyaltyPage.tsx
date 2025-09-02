import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@drivn-cook/shared";
import type { LoyaltyCard, LoyaltyTransaction } from "@drivn-cook/shared";
import { LoyaltyTier, LoyaltyTxnType } from "@drivn-cook/shared";

/** Pagination générique pour les réponses API */
type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

const API = "/api";

export default function LoyaltyPage() {
  const { user, isAuthenticated, loading: authLoading } = (useAuth() as any) ?? {};
  const customerId: string | undefined =
    user?.customer?.id ?? user?.customerId ?? user?.id;

  // ---- State
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [tx, setTx] = useState<LoyaltyTransaction[]>([]);
  const [cardLoading, setCardLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  // ---- Form local (EARN/SPEND/ADJUST)
  const [opType, setOpType] = useState<LoyaltyTxnType>(LoyaltyTxnType.EARN);
  const [points, setPoints] = useState<number>(10);
  const [refType, setRefType] = useState<string>("");
  const [refId, setRefId] = useState<string>("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- Helpers
  const header = useMemo(() => {
    if (authLoading) return "Chargement…";
    if (!isAuthenticated) return "Veuillez vous connecter";
    return "Programme de fidélité";
  }, [authLoading, isAuthenticated]);

  // mapping typé par enum (évite les "string" brutes)
  const tierClasses: Record<LoyaltyTier, string> = {
    [LoyaltyTier.BASIC]: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 border-zinc-300",
    [LoyaltyTier.SILVER]: "bg-slate-100 dark:bg-slate-800 text-slate-700 border-slate-300",
    [LoyaltyTier.GOLD]: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 border-yellow-300",
  };

  // ---- API calls in-page (pas de service dédié)
  const fetchFirstCard = async () => {
    if (!customerId) return;
    setCardLoading(true);
    setCardError(null);
    try {
      const { data } = await axios.get<Paginated<LoyaltyCard>>(`${API}/loyalty-cards`, {
        params: { page: 1, pageSize: 1, customerId },
        withCredentials: true,
      });
      setCard(data.items[0] ?? null);
    } catch (e: any) {
      setCardError(e?.message ?? "Erreur chargement carte");
    } finally {
      setCardLoading(false);
    }
  };

  const fetchTransactions = async (loyaltyCardId?: string) => {
    if (!loyaltyCardId) return;
    setTxLoading(true);
    setTxError(null);
    try {
      const { data } = await axios.get<Paginated<LoyaltyTransaction>>(
        `${API}/loyalty-transactions`,
        { params: { page: 1, pageSize: 50, loyaltyCardId }, withCredentials: true }
      );
      setTx(data.items);
    } catch (e: any) {
      setTxError(e?.message ?? "Erreur chargement transactions");
    } finally {
      setTxLoading(false);
    }
  };

  const mutatePoints = async () => {
    if (!card?.id) return;
    setSubmitError(null);
    if (points <= 0) {
      setSubmitError("Les points doivent être > 0");
      return;
    }
    setSubmitLoading(true);
    try {
      await axios.post(
        `${API}/loyalty-transactions/earn-or-spend`,
        {
          loyaltyCardId: card.id,
          customerId,
          type: opType, // LoyaltyTxnType.EARN | SPEND | ADJUST
          points,
          refType: refType || null,
          refId: refId || null,
        },
        { withCredentials: true }
      );
      // refresh
      await Promise.all([fetchFirstCard(), fetchTransactions(card.id)]);
      // reset champs
      setPoints(10);
      setRefType("");
      setRefId("");
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message ?? e?.message ?? "Erreur lors de l'opération");
    } finally {
      setSubmitLoading(false);
    }
  };

  const revertTransaction = async (id: string) => {
    setRevertingId(id);
    try {
      await axios.delete(`${API}/loyalty-transactions/${id}`, { withCredentials: true });
      await Promise.all([fetchFirstCard(), fetchTransactions(card?.id)]);
    } finally {
      setRevertingId(null);
    }
  };

  // ---- Effects
  useEffect(() => {
    if (!authLoading && isAuthenticated && customerId) {
      fetchFirstCard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, customerId]);

  useEffect(() => {
    if (card?.id) fetchTransactions(card.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  // ---- Render
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{header}</h1>

      {!isAuthenticated && (
        <div className="rounded-xl border p-4">
          Accès restreint. Connecte-toi pour voir ta carte.
        </div>
      )}

      {isAuthenticated && (
        <>
          {/* --- Bloc carte --- */}
          {cardLoading ? (
            <div className="rounded-xl border p-6">Chargement de la carte…</div>
          ) : cardError ? (
            <div className="rounded-xl border p-6 text-red-600">{cardError}</div>
          ) : !card ? (
            <div className="rounded-xl border p-6">
              Aucune carte associée à ce compte pour l’instant.
            </div>
          ) : (
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
                  <p className="text-sm text-zinc-500">Créée le</p>
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
          )}

          {/* --- Formulaire inline (earn/spend/adjust) --- */}
          {card && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutatePoints();
              }}
              className="rounded-2xl border p-5 bg-white dark:bg-zinc-900"
            >
              <h3 className="text-lg font-semibold mb-4">Opération sur les points</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Type</label>
                  <select
                    value={opType}
                    onChange={(e) => setOpType(e.target.value as LoyaltyTxnType)}
                    className="w-full rounded-lg border p-2 bg-transparent"
                  >
                    <option value={LoyaltyTxnType.EARN}>EARN (gagner)</option>
                    <option value={LoyaltyTxnType.SPEND}>SPEND (dépenser)</option>
                    <option value={LoyaltyTxnType.ADJUST}>ADJUST (ajuster)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Points</label>
                  <input
                    type="number"
                    min={1}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-lg border p-2 bg-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Ref Type (optionnel)</label>
                  <input
                    value={refType}
                    onChange={(e) => setRefType(e.target.value)}
                    placeholder="ORDER | EVENT | ..."
                    className="w-full rounded-lg border p-2 bg-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Ref ID (optionnel)</label>
                  <input
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    placeholder="Identifiant de référence"
                    className="w-full rounded-lg border p-2 bg-transparent"
                  />
                </div>
              </div>

              {submitError && <p className="text-red-600 mt-3">{submitError}</p>}

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl border hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitLoading ? "Enregistrement..." : "Valider"}
                </button>
              </div>
            </form>
          )}

          {/* --- Tableau inline --- */}
          {card && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Transactions</h3>
              {txLoading ? (
                <div className="rounded-xl border p-6">Chargement des transactions…</div>
              ) : txError ? (
                <div className="rounded-xl border p-6 text-red-600">{txError}</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-600">
                      <tr>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-right p-3">Points</th>
                        <th className="text-left p-3">Référence</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tx.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-zinc-500">
                            Aucune transaction.
                          </td>
                        </tr>
                      )}
                      {tx.map((t) => {
                        const sign =
                          t.type === LoyaltyTxnType.EARN
                            ? "+"
                            : t.type === LoyaltyTxnType.SPEND
                            ? "−"
                            : "";
                        return (
                          <tr key={t.id} className="border-t dark:border-zinc-800">
                            <td className="p-3">{new Date(t.createdAt).toLocaleString()}</td>
                            <td className="p-3">{t.type}</td>
                            <td className="p-3 text-right font-semibold">
                              {sign}
                              {t.points}
                            </td>
                            <td className="p-3">
                              {t.refType ? `${t.refType}#${t.refId ?? "-"}` : "-"}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => revertTransaction(t.id)}
                                disabled={revertingId === t.id}
                                className="px-3 py-1 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                              >
                                ⤺ Revert
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
