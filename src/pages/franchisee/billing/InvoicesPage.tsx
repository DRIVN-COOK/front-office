import React from 'react'
import { listInvoices, downloadInvoicePdf } from '../../../services/invoices.service'

export default function InvoicesPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    (async () => {
      try {
        const data = await listInvoices({ sort: '-createdAt', limit: 50 })
        setItems(data?.items ?? data ?? [])
      } catch (e: any) { setError(e?.message ?? 'Erreur') }
      finally { setLoading(false) }
    })()
  }, [])

  const onPdf = async (id: string) => {
    const blob = await downloadInvoicePdf(id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `invoice-${id}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div>Chargement…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Factures</h1>
      <div className="rounded-xl border divide-y overflow-hidden">
        {items.map((inv: any) => (
          <div key={inv.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">#{inv.id}</div>
              <div className="text-sm text-gray-600">Total: {inv.total?.toFixed?.(2)} € • Statut: {inv.status}</div>
            </div>
            <button onClick={() => onPdf(inv.id)} className="px-3 py-1.5 border rounded">PDF</button>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-gray-600">Aucune facture.</div>}
      </div>
    </div>
  )
}
