import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { startCustomerOrderPayment, confirmPayment } from '../../../services/customer-payment.service';

type EmbeddedCheckoutHandle = { mount: (selector: string) => void; unmount?: () => void };

export default function ClientOrderCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const orderId = (location.state as any)?.orderId || search.get('orderId') || '';

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const checkoutRef = useRef<EmbeddedCheckoutHandle | null>(null);
  const mountedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const canStart = useMemo(() => !!orderId && !submitting && !clientSecret, [orderId, submitting, clientSecret]);

  useEffect(() => {
    if (!orderId) setError("Aucune commande à régler.");
  }, [orderId]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!canStart) return;
      try {
        setSubmitting(true);
        setError(null);
        setInfo(null);

        // 1) Demande une session EMBEDDED (avec fallback hosted possible)
        const res = await startCustomerOrderPayment(orderId, { uiMode: 'embedded' });

        // Fallback hosted -> redirige
        if ('url' in res && res.url) {
          window.location.href = res.url;
          return;
        }

        // Embedded attendu
        if (!('clientSecret' in res) || !res.clientSecret || !res.sessionId) {
          throw new Error("Le serveur n'a pas renvoyé de clientSecret/sessionId pour l'embedded checkout.");
        }
        if (!active) return;

        setClientSecret(res.clientSecret);
        sessionIdRef.current = res.sessionId;

        // 2) Charger Stripe (une fois)
        if (!stripeRef.current) {
          const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
          if (!pk) throw new Error("VITE_STRIPE_PUBLISHABLE_KEY manquante.");
          const stripe = await loadStripe(pk);
          if (!stripe) throw new Error("Impossible d'initialiser Stripe.");
          stripeRef.current = stripe;
        }

        // 3) Monter l’Embedded Checkout (une fois)
        if (!mountedRef.current && stripeRef.current) {
          const checkout = await stripeRef.current.initEmbeddedCheckout({
            fetchClientSecret: async () => res.clientSecret!,
            onComplete: finalizeAfterPayment,
          });
          checkoutRef.current = { mount: checkout.mount, unmount: (checkout as any).unmount?.bind(checkout) };
          checkout.mount('#stripe-checkout');
          mountedRef.current = true;
          setInfo('Veuillez compléter le paiement ci-dessous.');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? "Erreur de paiement.");
        setSubmitting(false);
      }
    })();
    return () => { active = false; try { checkoutRef.current?.unmount?.() } catch {} };
  }, [canStart]);

  async function finalizeAfterPayment() {
    try {
      setInfo('Paiement validé, finalisation en cours…');

      const sessionId = sessionIdRef.current;
      if (!sessionId) throw new Error('Identifiant de session introuvable.');

      // 1) Confirme côté back
      await confirmPayment(sessionId);

      // 2) Redirige vers la page de succès/liste commandes
      navigate('/client/orders', { replace: true, state: { highlightId: orderId } });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Impossible de finaliser après paiement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Paiement de votre commande</h1>
      {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</div>}
      {info &&  <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{info}</div>}

      {/* Conteneur Embedded Checkout */}
      <div id="stripe-checkout" className="mt-4 rounded-xl border p-3 bg-white/5" />

      <div className="mt-4 text-sm opacity-70">
        <Link className="underline" to="/client/orders">Retour à mes commandes</Link>
      </div>
    </div>
  );
}
