// src/pages/franchisee/events/CreatePage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, api } from '@drivn-cook/shared' // client axios intercepté (Bearer + refresh)

type EventForm = {
  title: string
  description: string
  startAt: string  
  endAt: string    
  isPublic: boolean
  locationId?: string
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { user } = useAuth() as any

  const franchiseeId: string | undefined =
    user?.franchisee?.id ?? user?.franchiseeId ?? user?.profile?.franchiseeId ?? undefined

  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    isPublic: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange =
    (key: keyof EventForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.currentTarget.type === 'checkbox'
          ? (e.currentTarget as HTMLInputElement).checked
          : e.currentTarget.value
      setForm((f) => ({ ...f, [key]: value as any }))
    }

  const toIso = (v: string) => new Date(v).toISOString()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!franchiseeId) return setError("Votre profil n'est pas relié à une franchisée (franchiseeId manquant).")
    if (!form.title.trim()) return setError('Le titre est obligatoire.')
    if (!form.startAt) return setError('La date/heure de début est obligatoire.')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      startAt: toIso(form.startAt),
      endAt: form.endAt ? toIso(form.endAt) : undefined,
      isPublic: !!form.isPublic,
      franchiseeId,
      ...(form.locationId ? { locationId: form.locationId } : {}),
    }

    setLoading(true)
    try {
      await api.post('/events', payload) // Authorization auto via shared
      navigate('/franchisée/events')
    } catch (err: any) {
      const s = err?.response?.status
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        `Erreur ${s ?? ''}`.trim()

      setError(s === 401 ? "Session expirée ou non authentifié·e. Veuillez vous reconnecter." : String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Créer un événement</h1>
          <p className="text-sm opacity-70">Renseigne les informations puis enregistre.</p>
        </div>
        <Link to="/franchisée/events" className="px-3 py-2 rounded-lg border hover:bg-black/5 transition text-sm">
          ← Retour
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 p-4 rounded-2xl border">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Titre *</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={form.title} onChange={onChange('title')} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Début *</span>
            <input type="datetime-local" className="px-3 py-2 rounded-lg border bg-transparent"
                   value={form.startAt} onChange={onChange('startAt')} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Fin (optionnel)</span>
            <input type="datetime-local" className="px-3 py-2 rounded-lg border bg-transparent"
                   value={form.endAt} onChange={onChange('endAt')} />
          </label>

          {/* Si tu as un select de lieux existants, bind-le à locationId */}
          {/* <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Lieu (optionnel)</span>
            <select className="px-3 py-2 rounded-lg border bg-transparent"
                    value={form.locationId ?? ''} onChange={(e)=>setForm(f=>({...f, locationId: e.target.value || undefined}))}>
              <option value="">-- Aucun --</option>
              {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label> */}
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4"
                 checked={form.isPublic} onChange={onChange('isPublic')} />
          <span className="text-sm">Événement public</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Description</span>
          <textarea className="px-3 py-2 rounded-lg border bg-transparent min-h-28"
                    value={form.description} onChange={onChange('description')} />
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60">
            {loading ? 'Création…' : 'Créer l’événement'}
          </button>
          <Link to="/franchisée/events" className="px-4 py-2 rounded-lg border hover:bg-black/5 transition">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
