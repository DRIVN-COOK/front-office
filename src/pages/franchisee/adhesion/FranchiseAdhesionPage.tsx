import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@drivn-cook/shared'
import { applyForFranchise, confirmEntryFee, type FranchiseeApplyPayload } from './../../../services/franchisees'

const ENTRY_FEE_EUR = 50000
const DEPOTS = [
  { id: 'idf-nord',  name: 'Entrepôt Nord — Saint-Denis' },
  { id: 'idf-est',   name: 'Entrepôt Est — Noisy-le-Grand' },
  { id: 'idf-sud',   name: 'Entrepôt Sud — Massy' },
  { id: 'idf-ouest', name: 'Entrepôt Ouest — Nanterre' },
]

export default function FranchiseAdhesionPage() {
  const { user } = useAuth() as any
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const alreadyFranchisee = Boolean(user?.franchisee?.id ?? user?.franchiseeId)

  const sessionId = params.get('session_id')
  const success   = params.get('success') === '1'

  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [depotId, setDepotId] = useState<string>('')
  const [accept, setAccept] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (alreadyFranchisee) setInfo("Vous êtes déjà rattaché·e à une franchisée.")
  }, [alreadyFranchisee])

  // retour de paiement → confirmation via SERVICE
  useEffect(() => {
    if (!success || !sessionId) return
    let mounted = true
    ;(async () => {
      try {
        setSubmitting(true); setError(null)
        await confirmEntryFee(sessionId)
        if (mounted) {
          setInfo('Paiement validé. Votre franchise est créée ✅')
          navigate('/franchisée/dashboard', { replace: true })
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Impossible de confirmer le paiement.'
        if (mounted) setError(String(msg))
      } finally {
        if (mounted) setSubmitting(false)
      }
    })()
    return () => { mounted = false }
  }, [success, sessionId, navigate])

  const canSubmit = useMemo(() => {
    return !!user && !!companyName.trim() && !!phone.trim() && !!depotId && accept && !submitting
  }, [user, companyName, phone, depotId, accept, submitting])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setInfo(null)

    if (!user) {
      navigate('/login')
      return
    }
    if (!canSubmit) return

    const payload: FranchiseeApplyPayload = {
      companyName: companyName.trim(),
      phone: phone.trim(),
      depotId,
      acceptTerms: accept,
    }

    try {
      setSubmitting(true)
      const data = await applyForFranchise(payload)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      if (data.franchiseeId) {
        setInfo('Votre franchise a été créée ✅')
        navigate('/franchisée/dashboard', { replace: true })
        return
      }
      setInfo('Demande envoyée.')
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Échec de la demande.'
      setError(String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Devenir franchisé·e DRIVN-COOK</h1>
        <p className="text-sm opacity-70">Rejoignez le réseau et exploitez votre food-truck avec l’appui de la société mère.</p>
      </div>

      <section className="rounded-2xl border p-4 bg-white/5 mb-6">
        <h2 className="text-lg font-semibold mb-2">Conditions d’adhésion</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Droit d’entrée : <strong>{ENTRY_FEE_EUR.toLocaleString('fr-FR')} €</strong>.</li>
          <li>Redevance : <strong>4 %</strong> du chiffre d’affaires à reverser à la société mère.</li>
          <li>Approvisionnement : achat du stock à hauteur de <strong>80 %</strong> dans l’un des 4 entrepôts d’Île-de-France (20 % libres).</li>
          <li>Chaque entrepôt dispose d’une cuisine où les plats sont préparés avec soin.</li>
          <li>Après paiement, la franchise est créée automatiquement et vous irez chercher votre camion dans l’entrepôt choisi.</li>
        </ul>
      </section>

      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</div>}
      {info &&  <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{info}</div>}

      {alreadyFranchisee && (
        <div className="mb-6 rounded-xl border p-4 bg-white/5 text-sm flex items-center justify-between">
          <div>Vous êtes déjà rattaché·e à une franchisée.</div>
          <Link className="px-3 py-2 rounded-lg border hover:bg-black/5" to="/franchisée/dashboard">Ouvrir mon tableau de bord</Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border p-4 bg-white/5">
        {!user && (
          <div className="rounded-lg border px-3 py-2 text-sm bg-yellow-500/10 border-yellow-500/40 text-yellow-800">
            Vous devez être connecté·e pour poursuivre. <Link to="/login" className="underline">Se connecter</Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Raison sociale / Entreprise *</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={companyName} onChange={(e)=>setCompanyName(e.target.value)} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Téléphone *</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" required />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm opacity-80">Entrepôt de rattachement *</span>
            <select className="px-3 py-2 rounded-lg border bg-transparent"
                    value={depotId} onChange={(e)=>setDepotId(e.target.value)} required>
              <option value="" disabled>Choisir un entrepôt</option>
              {DEPOTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <span className="text-xs opacity-60 mt-1">
              Vous y retirerez votre camion après validation du paiement.
            </span>
          </label>
        </div>

        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={accept} onChange={(e)=>setAccept(e.target.checked)} />
          <span className="text-sm">
            J’accepte les conditions (droit d’entrée {ENTRY_FEE_EUR.toLocaleString('fr-FR')} €, 4 % du CA, 80 % d’achats en entrepôt).
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={!canSubmit}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60">
            {submitting ? 'Redirection vers le paiement…' : 'Payer et créer ma franchise'}
          </button>
          <Link to="/" className="px-4 py-2 rounded-lg border hover:bg-black/5">Annuler</Link>
        </div>
      </form>

      <div className="mt-6 text-sm opacity-70">
        Une fois la franchise créée, rendez-vous à l’entrepôt choisi pour récupérer votre camion et le kit de démarrage.
      </div>
    </div>
  )
}
