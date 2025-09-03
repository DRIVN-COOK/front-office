// src/pages/franchisee/events/PublicEventsPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, useAuth } from '@drivn-cook/shared'
import type { Event as EventDTO } from '@drivn-cook/shared'
import { joinEvent } from '../../../services/events.service'  // 👈 NEW

type ListResponse =
  | { items: EventDTO[]; page: number; pageSize: number; total: number }
  | EventDTO[]

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return iso as string
  }
}

function getRoles(user: any): string[] {
  const raw: string[] = user?.roles ?? (user?.role ? [user.role] : [])
  return raw.map((r) => String(r).toUpperCase())
}

export default function PublicEventsPage() {
  const { user } = useAuth() as any
  const roles = getRoles(user)
  const isFranchiseeOrAdmin =
    roles.includes('FRANCHISEE') || roles.includes('ADMIN') || roles.includes('ADMINISTRATOR')

  const navigate = useNavigate()

  const [events, setEvents] = useState<EventDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [joined, setJoined] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<ListResponse>('/events', {
          params: { publicOnly: true, page: 1, pageSize: 50 },
        })
        const items = Array.isArray(data) ? data : data.items
        if (mounted) setEvents(items)
      } catch (e: any) {
        if (mounted)
          setError(
            e?.response?.data?.message ?? e?.message ?? 'Impossible de charger les événements.'
          )
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return events.slice().sort((a, b) => (a.startAt > b.startAt ? 1 : -1))
    return events
      .filter((e) => [e.title, (e as any).description].some((x) => (x ?? '').toLowerCase().includes(q)))
      .sort((a, b) => (a.startAt > b.startAt ? 1 : -1))
  }, [events, query])

  async function handleJoin(eventId: string) {
    setError(null)

    if (!user) {
      navigate('/login')
      return
    }

    // 🔒 Interdit franchisés & admins
    if (isFranchiseeOrAdmin) {
      setError("Votre rôle ne permet pas de vous inscrire à un événement public.")
      return
    }

    try {
      await joinEvent(eventId)           // 👈 plus de customerId requis
      setJoined((prev) => new Set(prev).add(eventId))
    } catch (e: any) {
      const s = e?.response?.status
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        `Erreur ${s ?? ''}`

      if (s === 401) {
        navigate('/login')
      } else if (s === 409) {
        // déjà inscrit
        setJoined((prev) => new Set(prev).add(eventId))
      } else {
        setError(String(msg))
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Événements</h1>
          <p className="text-sm opacity-70">Découvrez les prochains rendez-vous ouverts au public.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-transparent"
            placeholder="Rechercher un évènement…"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-4">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-xl border text-center opacity-70">Aucun événement pour le moment.</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ev) => {
            const alreadyJoined = joined.has(ev.id)
            const blockJoin = isFranchiseeOrAdmin
            return (
              <li key={ev.id} className="rounded-2xl border p-4 bg-white/5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{ev.title}</h2>
                    <div className="text-sm opacity-70">
                      {formatDate(ev.startAt)}
                      {ev.endAt ? ` — ${formatDate(ev.endAt)}` : ''}
                    </div>
                  </div>
                  {ev.isPublic ? (
                    <span className="text-xs rounded-full border px-2 py-0.5 opacity-80">Public</span>
                  ) : (
                    <span className="text-xs rounded-full border px-2 py-0.5 opacity-50">Privé</span>
                  )}
                </div>

                {(ev as any).description && (
                  <p className="text-sm leading-relaxed line-clamp-3 opacity-90">
                    {(ev as any).description}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2">
                  <Link
                    to={`/events/${ev.id}`}
                    className="px-3 py-2 rounded-lg border hover:bg-black/5 transition text-sm"
                  >
                    Détails
                  </Link>

                  <button
                    onClick={() => handleJoin(ev.id)}
                    disabled={alreadyJoined || blockJoin}
                    title={
                      blockJoin
                        ? 'Réservé au public : les franchisés et admins ne peuvent pas participer.'
                        : undefined
                    }
                    className="px-3 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60 text-sm"
                  >
                    {alreadyJoined
                      ? 'Inscrit·e ✅'
                      : blockJoin
                      ? 'Participation non autorisée'
                      : 'Je participe'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
