import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, type Warehouse, type Franchisee, type Role } from '@drivn-cook/shared'
import { createFranchisee } from './../../../services/franchisee.service'
import { listWarehouses } from './../../../services/warehouse.service'
import { createFranchiseAgreement } from './../../../services/franchiseAgreement.service'
import { updateUser } from './../../../services/user.service'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { startFranchiseEntryPayment, confirmPayment } from './../../../services/payment.service'
import { attachSelfToFranchisee, getMeFull } from './../../../services/franchiseUser.service'

const ENTRY_FEE_EUR = 50000
const REVENUE_SHARE_PCT = 4

// ---------- Utils validation / normalisation ----------
const isValidSiren = (s: string) => /^\d{9}$/.test(s.replace(/\D/g, ''))
const normalizePhoneForApi = (raw: string) => {
  const s = raw.replace(/\s+/g, '')
  if (/^\+33[1-9]\d{8}$/.test(s)) return s
  if (/^0[1-9]\d{8}$/.test(s)) return '+33' + s.substring(1)
  return s
}

// ---------- Stockage temporaire (fallback hosted éventuel) ----------
const STORAGE_KEY = 'franchiseEntry.form'

type EmbeddedCheckoutHandle = { mount: (selector: string) => void; unmount?: () => void }

// Helper pour extraire un franchiseeId depuis /auth/me/full
function extractFranchiseeId(me: any): string | undefined {
  const legacy = me?.franchisee?.id ?? me?.franchiseeId ?? me?.franchisee_id
  if (legacy) return legacy
  const fu = Array.isArray(me?.franchiseUsers) ? me.franchiseUsers : []
  const firstWithFranchise = fu.find((x: any) => x?.franchisee?.id)
  return firstWithFranchise?.franchisee?.id
}

export default function FranchiseAdhesionPage() {
  const { user } = useAuth() as any
  const navigate = useNavigate()

  const alreadyFranchisee = Boolean(user?.franchisee?.id ?? user?.franchiseeId)

  const [companyName, setCompanyName] = useState('')
  const [siren, setSiren] = useState('')
  const [phone, setPhone] = useState('')
  const [depotId, setDepotId] = useState<string>('')
  const [autoCreateAgreement, setAutoCreateAgreement] = useState(true)

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [whLoading, setWhLoading] = useState(false)
  const [whErr, setWhErr] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Stripe embedded refs/states
  const stripeRef = useRef<Stripe | null>(null)
  const checkoutRef = useRef<EmbeddedCheckoutHandle | null>(null)
  const mountedRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Charger les entrepôts actifs
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setWhLoading(true); setWhErr(null)
        const res = await listWarehouses({ active: true, page: 1, pageSize: 100 })
        if (mounted) setWarehouses(res.items ?? [])
      } catch (e: any) {
        const m = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Impossible de charger les entrepôts.'
        if (mounted) setWhErr(String(m))
      } finally {
        if (mounted) setWhLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (alreadyFranchisee) setInfo('Vous êtes déjà rattaché·e à une franchisée.')
  }, [alreadyFranchisee])

  // Validation minimale
  const canSubmit = useMemo(() => {
    return !!user && !!companyName.trim() && isValidSiren(siren) && !!phone.trim() && !!depotId && !submitting && !clientSecret
  }, [user, companyName, siren, phone, depotId, submitting, clientSecret])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setInfo(null)

    if (!user) {
      navigate('/login?next=/franchisée/adhesion')
      return
    }
    if (!canSubmit) return

    try {
      setSubmitting(true)

      const payload = {
        companyName: companyName.trim(),
        siren: siren.replace(/\D/g, ''),
        phone: normalizePhoneForApi(phone),
        depotId,
        uiMode: 'embedded' as const,
      }

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))

      // 1) Créer la session de paiement (le back crée un Payment PENDING)
      const res = await startFranchiseEntryPayment(payload)

      // Fallback hosted si pas d’embedded
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
        return
      }

      // Embedded attendu
      if (!res.clientSecret || !res.sessionId) {
        throw new Error("Le serveur n'a pas renvoyé de clientSecret/sessionId pour l'embedded checkout.")
      }
      setClientSecret(res.clientSecret)
      sessionIdRef.current = res.sessionId

      // 2) Charger Stripe une seule fois
      if (!stripeRef.current) {
        const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
        if (!pk) throw new Error("VITE_STRIPE_PUBLISHABLE_KEY manquante dans le front (.env).")
        const stripe = await loadStripe(pk)
        if (!stripe) throw new Error("Impossible d'initialiser Stripe.")
        stripeRef.current = stripe
      }

      // 3) Monter l’Embedded Checkout une seule fois
      if (!mountedRef.current) {
        const checkout = await stripeRef.current.initEmbeddedCheckout({
          fetchClientSecret: async () => res.clientSecret!,
          onComplete: finalizeAfterPayment,
        })
        checkoutRef.current = { mount: checkout.mount, unmount: (checkout as any).unmount?.bind(checkout) }
        checkout.mount('#stripe-checkout')
        mountedRef.current = true
        setInfo('Veuillez compléter le paiement ci-dessous.')
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Le paiement a échoué.'
      setError(String(msg))
      setSubmitting(false)
    }
  }

  // Finalisation après succès Stripe Embedded
  const finalizeAfterPayment = async () => {
    try {
      setInfo('Paiement validé, finalisation en cours…')

      const sessionId = sessionIdRef.current
      if (!sessionId) throw new Error('Identifiant de session Stripe introuvable.')

      // 1) Confirme côté back (passe Payment en PAID)
      await confirmPayment(sessionId)

      // 2) Récupère l’utilisateur (post-paiement) — version enrichie
      const me = await getMeFull<any>()
      const userId: string | undefined = me?.id ?? me?._id
      let franchiseeId: string | undefined = extractFranchiseeId(me)

      // 3) Si pas de franchise → la créer avec les infos du formulaire
      if (!franchiseeId) {
        const created = await createFranchisee({
          name: companyName.trim(),
          siren: siren.replace(/\D/g, ''),
          contactPhone: normalizePhoneForApi(phone),
          defaultWarehouseId: depotId,
          active: true,
        } as Partial<Franchisee>)
        franchiseeId = created?.id
      }

      // 3.1) Attacher l'utilisateur à la franchise (OWNER) si pas encore lié
      if (franchiseeId) {
        try {
          await attachSelfToFranchisee({ franchiseeId, roleInFranchise: 'OWNER' })
        } catch (e: any) {
          const status = e?.response?.status
          if (status !== 409) throw e // 409 (déjà lié) → on ignore
        }
      }

      // 4) Créer le contrat si demandé et si on a un franchiseeId
      if (autoCreateAgreement && franchiseeId) {
        const startDate = new Date().toISOString().slice(0, 10)
        await createFranchiseAgreement({ franchiseeId, startDate } as any)
      }

      // 5) Promouvoir le rôle FRANCHISEE
      if (userId) {
        await updateUser(userId, { role: 'FRANCHISEE' as Role })

        // === Rafraîchir l'état Auth (me/full) ===
        await getMeFull().catch(() => void 0)

        // Nettoyage stockage temporaire
        sessionStorage.removeItem(STORAGE_KEY)

        // Forcer l’app à relire le rôle et le lien franchise (guards/menus)
        navigate('/franchisée/dashboard', { replace: true })
        location.reload()
        return
      }

      sessionStorage.removeItem(STORAGE_KEY)
      setInfo('Paiement validé. Franchise (et contrat) créés ✅')
      navigate('/franchisée/dashboard')
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Impossible de finaliser après paiement.'
      setError(String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  // Unmount propre de l’Embedded Checkout
  useEffect(() => {
    return () => { try { checkoutRef.current?.unmount?.() } catch {} }
  }, [])

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
          <li>Redevance : <strong>{REVENUE_SHARE_PCT} %</strong> du CA.</li>
          <li>Approvisionnement : achat du stock à hauteur de <strong>80 %</strong> dans un entrepôt actif.</li>
          <li>Chaque entrepôt dispose d’une cuisine où les plats sont préparés avec soin.</li>
          <li>Après paiement, la franchise est créée automatiquement et vous irez chercher votre camion dans l’entrepôt choisi.</li>
        </ul>
      </section>

      {whErr && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">{whErr}</div>}
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
            Vous devez être connecté·e pour poursuivre. <Link to="/login?next=/franchisée/adhesion" className="underline">Se connecter</Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Raison sociale / Entreprise *</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={companyName} onChange={(e)=>setCompanyName(e.target.value)}
                   disabled={!!clientSecret || submitting}
                   required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">SIREN *</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={siren} onChange={(e)=>setSiren(e.target.value.replace(/\D/g,'').slice(0,9))}
                   placeholder="123456789" disabled={!!clientSecret || submitting} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Téléphone *</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={phone} onChange={(e)=>setPhone(e.target.value)}
                   placeholder="+33 6 12 34 56 78" disabled={!!clientSecret || submitting} required />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm opacity-80">Entrepôt de rattachement *</span>
            <select
              className="px-3 py-2 rounded-lg border bg-transparent"
              value={depotId}
              onChange={(e)=>setDepotId(e.target.value)}
              required
              disabled={whLoading || !!clientSecret || submitting}
            >
              <option value="" disabled>{whLoading ? 'Chargement des entrepôts…' : 'Choisir un entrepôt'}</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.city ? `— ${w.city}` : ''} {w.active === false ? ' (inactif)' : ''}
                </option>
              ))}
            </select>
            <span className="text-xs opacity-60 mt-1">Vous y retirerez votre camion après validation du paiement.</span>
          </label>
        </div>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={autoCreateAgreement}
            onChange={(e)=>setAutoCreateAgreement(e.target.checked)}
            disabled={!!clientSecret || submitting}
          />
          <span className="text-sm">
            Créer automatiquement le contrat après paiement (droit d’entrée {ENTRY_FEE_EUR.toLocaleString('fr-FR')} €, redevance {REVENUE_SHARE_PCT}%).
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (clientSecret ? 'Paiement en cours…' : 'Initialisation…') : (clientSecret ? 'Paiement en cours ci-dessous…' : 'Payer et créer ma franchise')}
          </button>
          <Link to="/" className="px-4 py-2 rounded-lg border hover:bg-black/5">Annuler</Link>
        </div>
      </form>

      {/* Conteneur Embedded Checkout */}
      <div id="stripe-checkout" className="mt-5 rounded-xl border p-3 bg-white/5" />

      <div className="mt-6 text-sm opacity-70">
        Une fois la franchise créée, rendez-vous à l’entrepôt choisi pour récupérer votre camion et le kit de démarrage.
      </div>
    </div>
  )
}
