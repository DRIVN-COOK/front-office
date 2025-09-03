// src/pages/clients/cart/CartPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type MenuItem } from '@drivn-cook/shared';

// Services FRONT (customer orders)
import {
  createCustomerOrder,
  addCustomerOrderLine,
  type CreateCustomerOrderPayload,
} from '../../../services/customer-order-lines.service';

type CartLine = { item: MenuItem; qty: number };

function toNum(v: number | string | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}
function priceHT(mi: MenuItem) {
  return toNum(mi.priceHT);
}
function priceTTC(mi: MenuItem) {
  const ht = priceHT(mi);
  const tva = toNum(mi.tvaPct);
  return ht * (1 + tva / 100);
}
function lineTotals(l: CartLine) {
  const unitHT = priceHT(l.item);
  const tvaPct = toNum(l.item.tvaPct);
  const lineHT = unitHT * l.qty;
  const lineTVA = lineHT * (tvaPct / 100);
  const lineTTC = lineHT + lineTVA;
  return { unitHT, tvaPct, lineHT, lineTVA, lineTTC };
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth() as any;

  const [cart, setCart] = useState<CartLine[]>([]);
  const [placing, setPlacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Charge depuis localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setCart(JSON.parse(s));
    } catch {
      setCart([]);
    }
  }, []);

  // Persiste et notifie le Header
  const persist = (next: CartLine[]) => {
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
    window.dispatchEvent(new Event('cart:update'));
  };

  const setQty = (id: string, qtyRaw: number) => {
    const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.floor(qtyRaw)) : 1;
    persist(cart.map(l => (l.item.id === id ? { ...l, qty } : l)));
  };

  const removeLine = (id: string) => persist(cart.filter(l => l.item.id !== id));
  const clearCart = () => persist([]);

  // Totaux globaux
  const totals = useMemo(() => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    for (const l of cart) {
      const { lineHT, lineTVA, lineTTC } = lineTotals(l);
      totalHT += lineHT;
      totalTVA += lineTVA;
      totalTTC += lineTTC;
    }
    return { totalHT, totalTVA, totalTTC };
  }, [cart]);

  const totalTTC = totals.totalTTC;
  const itemsCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  // --- Création d'une CUSTOMER ORDER (PENDING) + lignes ---
  async function createCustomerOrderWithLines() {
    // Récup dynamiques + fallbacks .env
    const customerId =
      (user?.customer?.id as string | undefined) ??
      (user?.id as string | undefined) ??
      (import.meta.env.VITE_CUSTOMER_ID as string | undefined);

    const franchiseeId =
      (localStorage.getItem('activeFranchiseeId') as string | null) ??
      (user?.franchisee?.id as string | undefined) ??
      (user?.franchiseeId as string | undefined) ??
      (import.meta.env.VITE_FRANCHISEE_ID as string | undefined);

    const warehouseId =
      (localStorage.getItem('activeWarehouseId') as string | null) ??
      (import.meta.env.VITE_WAREHOUSE_ID as string | undefined);

    const truckId =
      (localStorage.getItem('activeTruckId') as string | null) ??
      (import.meta.env.VITE_TRUCK_ID as string | undefined);

    if (!customerId) {
      // Pas connecté → page login
      navigate('/login?next=/client/cart');
      throw new Error('Vous devez être connecté pour commander.');
    }
    if (!franchiseeId) {
      throw new Error("Aucun franchisé sélectionné. Ouvrez un menu associé à un point de vente.");
    }
    if (cart.length === 0) throw new Error('Votre panier est vide.');

    const payload: CreateCustomerOrderPayload = {
      customerId,
      franchiseeId,
      ...(truckId ? { truckId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      channel: 'IN_PERSON',
      totalHT: Number(totals.totalHT.toFixed(2)),
      totalTVA: Number(totals.totalTVA.toFixed(2)),
      totalTTC: Number(totals.totalTTC.toFixed(2)),
    };

    // 1) Créer la commande client (status par défaut: PENDING)
    const co = await createCustomerOrder(payload);

    // 2) Ajouter les lignes
    for (const l of cart) {
      const { unitHT, tvaPct, lineHT } = lineTotals(l);
      await addCustomerOrderLine({
        customerOrderId: co.id,
        menuItemId: (l.item as any).id,
        qty: l.qty,
        unitPriceHT: Number(unitHT.toFixed(2)),
        tvaPct: Number(tvaPct.toFixed(4)),
        lineTotalHT: Number(lineHT.toFixed(2)),
      });
    }

    return co;
  }

  // --- Commander maintenant: redirection vers la page de paiement dédiée ---
  async function handlePay() {
    setErr(null);
    if (cart.length === 0) return;
    try {
      setPlacing(true);
      const co = await createCustomerOrderWithLines();
      clearCart();
      navigate('/client/order/checkout', { state: { orderId: co.id } });
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Impossible de créer la commande. Réessaie.';
      setErr(msg);
    } finally {
      setPlacing(false);
    }
  }

  // --- Commander plus tard: on laisse la commande en PENDING ---
  async function handleOrderLater() {
    setErr(null);
    if (cart.length === 0) return;
    try {
      setSaving(true);
      const co = await createCustomerOrderWithLines();
      clearCart();
      navigate('/client/order/my', { state: { highlightId: co.id } });
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || "Impossible d'enregistrer la commande. Réessaie.";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Votre panier</h1>
          <p className="text-neutral-500">
            {itemsCount} article{itemsCount > 1 ? 's' : ''}
          </p>
        </div>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-sm underline">
            Vider
          </button>
        )}
      </header>

      {err && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="py-16 text-center text-neutral-600">
          Panier vide.{' '}
          <Link to="/client/menu" className="underline">
            Voir le menu
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lignes */}
          <div className="lg:col-span-2">
            {cart.map((l) => {
              const ttc = priceTTC(l.item);
              return (
                <div
                  key={l.item.id}
                  className="flex items-center justify-between gap-4 border rounded-xl p-3 mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded overflow-hidden">
                      {l.item.imageUrl ? (
                        <img
                          src={l.item.imageUrl}
                          alt={l.item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          —
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{l.item.name}</div>
                      <div className="text-sm text-neutral-500">{eur(ttc)} / unité</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={l.qty}
                      onChange={(e) => setQty(l.item.id, Number(e.target.value))}
                      className="w-20 border rounded px-2 py-1"
                    />
                    <div className="w-24 text-right font-medium">{eur(ttc * l.qty)}</div>
                    <button onClick={() => removeLine(l.item.id)} className="text-sm underline">
                      Retirer
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="mt-4">
              <Link to="/client/menu" className="text-sm underline">
                ← Continuer mes achats
              </Link>
            </div>
          </div>

          {/* Récap */}
          <aside className="lg:col-span-1 border rounded-xl p-4 h-fit">
            <h2 className="text-lg font-semibold mb-3">Récapitulatif</h2>
            <div className="flex justify-between py-1">
              <span>Sous-total TTC</span>
              <span className="font-medium">{eur(totalTTC)}</span>
            </div>
            <div className="text-xs text-neutral-500 mb-4">
              TVA incluse selon chaque article.
            </div>

            {/* Bouton principal: Commander maintenant */}
            <button
              onClick={placing ? undefined : handlePay}
              disabled={placing || saving}
              className="w-full rounded-xl bg-black text-white py-2 font-medium hover:bg-neutral-800 disabled:opacity-60"
            >
              {placing ? 'Création de la commande…' : 'Commander'}
            </button>

            {/* Bouton secondaire: Commander plus tard */}
            <button
              onClick={saving ? undefined : handleOrderLater}
              disabled={placing || saving}
              className="mt-2 w-full rounded-xl border border-neutral-300 py-2 font-medium hover:bg-neutral-50 disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Commander plus tard'}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
