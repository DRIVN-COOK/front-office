import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

type DecimalString = string;

interface OrderLine {
  id: string;
  menuItemId: string;
  qty: number;
  unitPriceHT: DecimalString;
  tvaPct: DecimalString;
  lineTotalHT: DecimalString;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'FULFILLED' | 'CANCELLED';
  placedAt: string;
  totalHT: DecimalString;
  totalTVA: DecimalString;
  totalTTC: DecimalString;
  lines?: OrderLine[];
  invoice?: { pdfUrl?: string | null } | null;
}

function eur(n: number | string) {
  const v = typeof n === 'number' ? n : Number(n);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}

async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`/api/customer-orders/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [order, setOrder] = useState<Order | null>(location?.state?.order ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order || !id) return;
    fetchOrder(id).then(setOrder).catch(() => setError('Impossible de récupérer la commande.'));
  }, [id, order]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Confirmation</h1>
        <p className="text-red-600">{error}</p>
        <div className="mt-4">
          <button onClick={() => navigate('/client/menu')} className="px-4 py-2 border rounded">Retour au menu</button>
        </div>
      </div>
    );
  }

  if (!order) return <div className="mx-auto max-w-3xl px-4 py-10">Chargement…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Merci pour votre commande 🎉</h1>
      <p className="text-neutral-600 mt-2">N° commande : <span className="font-mono">{order.id}</span></p>
      <p className="text-neutral-600">Statut : <span className="font-medium">{order.status}</span></p>

      <div className="mt-6 border rounded p-4">
        <div className="flex items-center justify-between">
          <span>Total HT</span><span>{eur(order.totalHT)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>TVA</span><span>{eur(order.totalTVA)}</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-lg font-semibold">
          <span>Total TTC</span><span>{eur(order.totalTTC)}</span>
        </div>
      </div>

      {order.invoice?.pdfUrl && (
        <div className="mt-4">
          <a href={order.invoice.pdfUrl} target="_blank" rel="noreferrer" className="underline">
            Télécharger la facture (PDF)
          </a>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => navigate('/client/order/my')} className="px-4 py-2 border rounded">
          Voir mes commandes
        </button>
        <button onClick={() => navigate('/client/menu')} className="px-4 py-2 rounded bg-black text-white">
          Retour au menu
        </button>
      </div>
    </div>
  );
}
