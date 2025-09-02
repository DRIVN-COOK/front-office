// src/pages/clients/cart/CartPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { MenuItem } from '@drivn-cook/shared';

type CartLine = { item: MenuItem; qty: number };

function toNum(v: number | string | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}
function priceTTC(mi: MenuItem) {
  const ht = toNum(mi.priceHT);
  const tva = toNum(mi.tvaPct);
  return ht * (1 + tva / 100);
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartLine[]>([]);

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

  const totalTTC = useMemo(
    () => cart.reduce((s, l) => s + priceTTC(l.item) * l.qty, 0),
    [cart]
  );
  const itemsCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

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
            <button
              onClick={() => navigate('/client/order/checkout', { state: { cart } })}
              className="w-full rounded-xl bg-black text-white py-2 font-medium hover:bg-neutral-800"
            >
              Commander
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
