import { useEffect, useState } from 'react'
import { api, useAuth } from '@drivn-cook/shared'
import { updateUser } from '../services/user.service'

type MeUpdatePayload = {
  firstName?: string
  lastName?: string
}

export default function ProfilePage() {
  const { user } = useAuth() as any
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState<string | null>(null)
  const [err, setErr]             = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
    }
  }, [user])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null); setSaving(true)

    if (!user?.id) {
      setErr('Utilisateur non authentifié')
      setSaving(false)
      return
    }

    const payload: MeUpdatePayload = {
      firstName: firstName.trim() || undefined,
      lastName:  lastName.trim()  || undefined,
    }

    try {
      await updateUser(user.id, payload)
      setMsg('Profil mis à jour ✅')
    } catch (e: any) {
      const m = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Échec de la mise à jour'
      setErr(String(m))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Mon profil</h1>

      {err && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}
      {msg && <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{msg}</div>}

      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border p-4 bg-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Prénom</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Nom</span>
            <input className="px-3 py-2 rounded-lg border bg-transparent"
                   value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          </label>
        </div>

        <div className="text-sm opacity-70">
          <div><span className="opacity-60">Email :</span> {user?.email}</div>
          <div><span className="opacity-60">Rôle :</span> {user?.role}</div>
        </div>

        <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <div className="mt-8">
        <ChangePasswordCard />
      </div>
    </div>
  )
}

function ChangePasswordCard() {
  const { user } = useAuth() as any
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew]         = useState('')
  const [confirm, setConfirm]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState<string | null>(null)
  const [err, setErr]                 = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)

    if (!user?.id) {
      setErr('Utilisateur non authentifié')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setErr('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirm) {
      setErr('Les mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)
    try {
      // pas de wrapper dans user.service : on utilise l’endpoint auth direct
      await api.put('/auth/password', { currentPassword, newPassword })
      setMsg('Mot de passe mis à jour ✅')
      setCurrent(''); setNew(''); setConfirm('')
    } catch (e: any) {
      const m = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Impossible de changer le mot de passe'
      setErr(String(m))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-4 bg-white/5">
      <h2 className="text-lg font-semibold">Changer mon mot de passe</h2>

      {err && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}
      {msg && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{msg}</div>}

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-80">Mot de passe actuel</span>
        <input type="password" className="px-3 py-2 rounded-lg border bg-transparent"
               value={currentPassword} onChange={(e)=>setCurrent(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-80">Nouveau mot de passe</span>
        <input type="password" className="px-3 py-2 rounded-lg border bg-transparent"
               value={newPassword} onChange={(e)=>setNew(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-80">Confirmer le nouveau mot de passe</span>
        <input type="password" className="px-3 py-2 rounded-lg border bg-transparent"
               value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
      </label>

      <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-60">
        {saving ? 'Mise à jour…' : 'Mettre à jour'}
      </button>
    </form>
  )
}
