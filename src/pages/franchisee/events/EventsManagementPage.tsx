// src/pages/EventsManagementPage.tsx
import { useEffect, useState } from 'react';
import type { Event } from '@drivn-cook/shared';
import {
  listEvents,
  updateEvent,
  deleteEvent,
} from '../../../services/events.service' 

type Row = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  isPublic: boolean;
  franchiseeId: string;
  locationId?: string | null;
  registrationsCount?: number;
  createdAt: string;
};

export default function EventsManagementPage() {
  // NOTE: 'from'/'to' gardés visuellement mais non envoyés (validator back ne les supporte pas)
  const [q, setQ] = useState({
    from: '',
    to: '',
    franchiseeId: '',
    isPublic: '', // '', 'true', 'false' -> mappé vers isPublic
    page: 1,
    pageSize: 20,
  });

  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    franchiseeId: '',
    startAt: '',
    endAt: '',
    isPublic: true,
    locationId: '',
  });

  async function load() {
    setLoading(true);
    try {
      const params: {
        franchiseeId?: string;
        isPublic?: boolean;
        page?: number;
        pageSize?: number;
      } = {
        franchiseeId: q.franchiseeId || undefined,
        isPublic: q.isPublic === '' ? undefined : q.isPublic === 'true',
        page: q.page,
        pageSize: q.pageSize,
      };

      const data = await listEvents(params);
      const list: Event[] = Array.isArray(data) ? data : data.items ?? [];
      const totalVal: number = Array.isArray(data) ? data.length : data.total ?? list.length;

      const rows: Row[] = list.map((e) => ({
        id: e.id,
        title: e.title,
        description: (e as any).description ?? null,
        startAt: e.startAt as any,
        endAt: (e as any).endAt ?? null,
        isPublic: (e as any).isPublic ?? true,
        franchiseeId: (e as any).franchiseeId,
        locationId: (e as any).locationId ?? null,
        registrationsCount: (e as any).registrationsCount ?? undefined,
        createdAt: (e as any).createdAt,
      }));

      setItems(rows);
      setTotal(totalVal);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.from, q.to, q.franchiseeId, q.isPublic, q.page, q.pageSize]);

  function openEdit(e: Row) {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description || '',
      franchiseeId: e.franchiseeId,
      startAt: e.startAt,
      endAt: e.endAt || '',
      isPublic: e.isPublic,
      locationId: e.locationId || '',
    });
    setIsOpen(true);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return; // sécurité : pas de création
    const payload: Partial<Event> = {
      ...(form as any),
      locationId: form.locationId || undefined,
      endAt: form.endAt || undefined,
      // startAt / endAt: z.coerce.date() côté back -> accepte string ISO
    };

    await updateEvent(editing.id, payload);

    setIsOpen(false);
    setEditing(null);
    setQ((p) => ({ ...p, page: 1 }));
    await load();
  }

  async function del(id: string) {
    if (!confirm('Supprimer cet événement ?')) return;
    await deleteEvent(id);
    await load();
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Événements</h1>
        <div className="ml-auto grid grid-cols-2 md:grid-cols-5 gap-2">
          <input
            placeholder="from (YYYY-MM-DD)"
            value={q.from}
            onChange={(e) => setQ((p) => ({ ...p, from: e.target.value, page: 1 }))}
            className="border rounded px-2 py-1 text-sm"
          />
          <input
            placeholder="to (YYYY-MM-DD)"
            value={q.to}
            onChange={(e) => setQ((p) => ({ ...p, to: e.target.value, page: 1 }))}
            className="border rounded px-2 py-1 text-sm"
          />
          <input
            placeholder="FranchiseeId"
            value={q.franchiseeId}
            onChange={(e) => setQ((p) => ({ ...p, franchiseeId: e.target.value, page: 1 }))}
            className="border rounded px-2 py-1 text-sm"
          />
          <select
            value={q.isPublic}
            onChange={(e) => setQ((p) => ({ ...p, isPublic: e.target.value as any, page: 1 }))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Tous</option>
            <option value="true">Public</option>
            <option value="false">Privé</option>
          </select>
          <button onClick={load} className="border rounded px-2 py-1 text-sm">
            Filtrer
          </button>
        </div>
        {/* ❌ Plus de création depuis la page de management */}
      </header>

      <div className="text-sm opacity-70">{loading ? 'Chargement…' : `Total: ${total}`}</div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left px-3 py-2">Titre</th>
              <th className="text-left px-3 py-2">Franchisé</th>
              <th className="text-left px-3 py-2">Début</th>
              <th className="text-left px-3 py-2">Fin</th>
              <th className="text-left px-3 py-2">Public</th>
              <th className="text-left px-3 py-2">Inscriptions</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ev) => (
              <tr key={ev.id} className="border-t">
                <td className="px-3 py-2">{ev.title}</td>
                <td className="px-3 py-2">{ev.franchiseeId?.slice(0, 8)}…</td>
                <td className="px-3 py-2">{new Date(ev.startAt).toLocaleString()}</td>
                <td className="px-3 py-2">{ev.endAt ? new Date(ev.endAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2">{ev.isPublic ? 'Oui' : 'Non'}</td>
                <td className="px-3 py-2">{ev.registrationsCount ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => openEdit(ev)} className="underline mr-2">
                    Éditer
                  </button>
                  <button onClick={() => del(ev.id)} className="underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center opacity-60">
                  Aucun événement
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal édition uniquement */}
      {isOpen && editing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-md w-full max-w-2xl">
            <form onSubmit={submit} className="p-4 space-y-3">
              <h2 className="text-lg font-semibold">Modifier l’événement</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Titre</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">FranchiseeId</label>
                  <input
                    value={form.franchiseeId}
                    onChange={(e) => setForm({ ...form, franchiseeId: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Début (ISO)</label>
                  <input
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="2025-09-01T10:00:00Z"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Fin (ISO)</label>
                  <input
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">LocationId (optionnel)</label>
                  <input
                    value={form.locationId}
                    onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm self-end">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  />{' '}
                  Public
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setIsOpen(false); setEditing(null); }} className="border rounded px-3 py-1">
                  Annuler
                </button>
                <button type="submit" className="border rounded px-3 py-1">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
