// RegisterPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@drivn-cook/shared'; // <-- shared
// (on garde notre RegisterForm local)

export default function RegisterPage() {
  const { register } = useAuth() as any; // type selon ton shared
  const nav = useNavigate();

  return (
    <div>
      <h1>Créer un compte</h1>
      <RegisterForm
        onSubmit={async (raw) => {
          // Nettoyage coté page ('' -> undefined, email trim/lower)
          const payload = {
            email: raw.email.trim().toLowerCase(),
            password: raw.password,
            firstName: raw.firstName?.trim() || undefined,
            lastName:  raw.lastName?.trim()  || undefined,
          };
          // (Optionnel) petite validation UI
          if (!/\S+@\S+\.\S+/.test(payload.email)) {
            alert('Email invalide'); return;
          }
          if (!payload.password || payload.password.length < 8) {
            alert('Mot de passe trop court (min 8)'); return;
          }

          // Appel du register du shared avec un payload propre
          await register(payload);
          nav('/');
        }}
      />
    </div>
  );
}

export function RegisterForm({
  onSubmit,
}: {
  onSubmit: (p: { email: string; password: string; firstName?: string; lastName?: string }) => void;
}) {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form); // on laisse le parent normaliser
      }}
      className="flex flex-col gap-3"
    >
      <input
        value={form.firstName}
        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
        placeholder="Prénom"
      />
      <input
        value={form.lastName}
        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
        placeholder="Nom"
      />
      <input
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        placeholder="Mot de passe"
        minLength={8}
        required
      />
      <button type="submit">Créer mon compte</button>
    </form>
  );
}
