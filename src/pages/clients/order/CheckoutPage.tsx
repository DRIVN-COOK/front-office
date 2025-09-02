// src/pages/clients/order/CheckoutPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";

/* -------------------- Types locaux (alignés sur ton front) -------------------- */
type ISODateString = string;
type DecimalString = string;

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  priceHT: DecimalString;
  tvaPct: DecimalString;
  imageUrl?: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

type CartLine = { item: MenuItem; qty: number };

/* --------------------------------- Helpers ---------------------------------- */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
const API = "/api";

function toNum(v: number | string | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function priceTTC(mi: MenuItem) {
  const ht = toNum(mi.priceHT);
  const tva = toNum(mi.tvaPct);
  return ht * (1 + tva / 100);
}
function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ------------------------- Panel Stripe (Elements) -------------------------- */
function StripePayPanel({
  amountEuro,
  onSuccess,
}: {
  amountEuro: number;
  onSuccess: (id: string) => void; // id = paymentId (si renvoyé) sinon paymentIntentId
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null); // id de ta table Payment, si le back le renvoie
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = Math.max(0, Math.round((amountEuro || 0) * 100));

  // Initialise un PaymentIntent côté serveur
  useEffect(() => {
    (async () => {
      setError(null);
      setBusy(true);
      try {
        /**
         * Endpoint attendu côté API (voir contrôleur Stripe que je t'ai donné) :
         * POST /api/stripe/create-payment-intent { amount, currency }
         * -> { clientSecret, paymentIntentId, paymentId? }
         */
        const data = await postJSON<{ clientSecret: string; paymentIntentId: string; paymentId?: string }>(
          `${API}/stripe/create-payment-intent`,
          { amount: amountCents, currency: "EUR" }
        );
        setClientSecret(data.clientSecret);
        setPaymentId(data.paymentId ?? null);
      } catch (e: any) {
        setError(e?.message ?? "Impossible d'initialiser le paiement.");
      } finally {
        setBusy(false);
      }
    })();
  }, [amountCents]);

  const pay = async () => {
    if (!stripe || !elements || !clientSecret) return;
    setBusy(true);
    setError(null);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (result.error) {
        setError(result.error.message ?? "Paiement refusé.");
        return;
      }
      if (result.paymentIntent?.status === "succeeded") {
        const piId = result.paymentIntent.id;

        // Si tu n'utilises pas le webhook Stripe, on marque le Payment "PAID" ici :
        if (paymentId) {
          await patchJSON(`${API}/payments/${paymentId}`, {
            status: "PAID",
            transactionRef: piId, // mappé sur providerPaymentIntentId côté back
          });
          onSuccess(paymentId);
        } else {
          // Si ton create-payment-intent ne crée pas d'entrée Payment, on redirige avec l'id Stripe
          onSuccess(piId);
        }
      } else {
        setError("Le paiement n'a pas abouti.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Erreur pendant la confirmation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-neutral-900">
      <h3 className="text-lg font-semibold mb-3">Paiement par carte</h3>

      <div className="rounded-lg border p-3 bg-white dark:bg-neutral-900">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {error && <div className="text-red-600 mt-3">{error}</div>}

      <button
        disabled={busy || !clientSecret}
        onClick={pay}
        className="mt-4 px-4 py-2 rounded bg-black text-white disabled:bg-neutral-400"
      >
        {busy ? "Paiement en cours…" : `Payer ${eur(amountEuro)}`}
      </button>

      {!clientSecret && (
        <div className="text-sm text-neutral-500 mt-2">Initialisation du paiement…</div>
      )}
    </div>
  );
}

/* ------------------------------ Page Checkout ------------------------------- */
export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Panier depuis state ou localStorage
  const stateCart = (location.state as any)?.cart as CartLine[] | undefined;
  const [cart, setCart] = useState<CartLine[]>(
    stateCart ??
      (() => {
        const s = localStorage.getItem("cart");
        if (!s) return [];
        try {
          return JSON.parse(s);
        } catch {
          return [];
        }
      })
  );

  const totalTTC = useMemo(
    () => cart.reduce((s, l) => s + priceTTC(l.item) * l.qty, 0),
    [cart]
  );

  const handleSuccess = (id: string) => {
    // Vide le panier local
    setCart([]);
    localStorage.removeItem("cart");

    // Redirection vers ta page de confirmation
    navigate(`/client/order/confirmation/${id}`, {
      state: { amount: totalTTC },
      replace: true,
    });
  };

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Paiement</h1>
        <p className="text-red-600">
          Variable d’environnement manquante : <code>VITE_STRIPE_PUBLISHABLE_KEY</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Paiement</h1>

      {cart.length === 0 ? (
        <div className="rounded-2xl border p-4">Panier vide.</div>
      ) : (
        <>
          {/* Récap commande */}
          <div className="rounded-2xl border p-4 mb-6 bg-white dark:bg-neutral-900">
            <h3 className="font-semibold mb-2">Votre commande</h3>
            <div className="space-y-2">
              {cart.map((l) => (
                <div key={l.item.id} className="flex items-center justify-between">
                  <div>
                    {l.item.name} <span className="text-neutral-500">× {l.qty}</span>
                  </div>
                  <div className="font-medium">{eur(priceTTC(l.item) * l.qty)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between font-semibold">
              <span>Total TTC</span>
              <span>{eur(totalTTC)}</span>
            </div>
          </div>

          {/* Stripe Elements */}
          <Elements stripe={stripePromise}>
            <StripePayPanel amountEuro={totalTTC} onSuccess={handleSuccess} />
          </Elements>
        </>
      )}
    </div>
  );
}
