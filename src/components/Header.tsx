// src/components/Header.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@drivn-cook/shared';
import { API_URL } from '../config';

function useCartCount() {
  const [count, setCount] = useState(0);
  const read = () => {
    try {
      const s = localStorage.getItem('cart');
      const arr = s ? JSON.parse(s) : [];
      const c = Array.isArray(arr) ? arr.reduce((sum: number, l: any) => sum + (l?.qty ?? 0), 0) : 0;
      setCount(c);
    } catch {
      setCount(0);
    }
  };
  useEffect(() => {
    read();
    const handler = () => read();
    window.addEventListener('storage', handler);
    window.addEventListener('focus', handler);
    window.addEventListener('cart:update', handler as any);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', handler);
      window.removeEventListener('cart:update', handler as any);
    };
  }, []);
  return count;
}

export default function Header() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth() as any;
  const roles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
  const hasRole = (r: string) => roles.includes(r);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  // Fermer dropdown au clic extérieur / ESC
  useEffect(() => {
    const onOutside = (e: PointerEvent) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setAccountOpen(false);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const linkBase =
    'px-3 py-2 rounded-md text-sm font-medium transition hover:text-black hover:bg-neutral-100';
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${isActive ? 'bg-neutral-100 text-black' : 'text-neutral-600'}`;

  async function handleLogout() {
    try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); }
    catch { /* ignore */ }
    finally {
      navigate('/', { replace: true });
      window.location.reload();
    }
  }

  const userInitial = user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';
  const userLabel = user?.firstName ?? user?.email ?? 'Compte';
  const cartCount = useCartCount();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        {/* Brand + burger */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded hover:bg-neutral-100"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(v => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <Link to="/" className="font-extrabold tracking-tight">
            DRIVN-COOK
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/client/menu" className={navClass}>Menu</NavLink>
          <NavLink to="/client/order/my" className={navClass}>Mes commandes</NavLink>
<<<<<<< HEAD
          <NavLink to="/franchisée/events" className={navClass}>Événements</NavLink>
=======
          <NavLink to="/events" className={navClass}>Événements</NavLink>
>>>>>>> cab8b67 (front final)
          <NavLink to="/devenir-franchisee" className={navClass}>Devenir franchisée</NavLink>
          {hasRole('FRANCHISEE') && (
            <NavLink to="/franchisée/dashboard" className={navClass}>Espace franchisée</NavLink>
          )}
        </nav>

        {/* Right zone: Cart + Account */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link to="/client/cart" className="relative p-2 rounded hover:bg-neutral-100" aria-label="Panier">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {/* icône cloche/plat */}
              <path d="M4 18h16M6 18a6 6 0 0112 0M10 8a2 2 0 104 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {isLoading ? null : user ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-300 hover:bg-neutral-50"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs">
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-sm">{userLabel}</span>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  tabIndex={-1}
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50"
                >
                  <div className="px-4 py-3 text-sm text-neutral-600">
                    Connecté en tant que{' '}
                    <span className="font-medium text-neutral-900">{user.email ?? user.firstName}</span>
                  </div>

                  <div className="border-t" />
                  {/* Liens généraux */}
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => setAccountOpen(false)}
                  >
                    Profil
                  </Link>
                  <Link
                    to="/client/order/my"
                    className="block px-4 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => setAccountOpen(false)}
                  >
                    Mes commandes
                  </Link>

                  {/* Section FRANCHISÉE */}
                  {hasRole('FRANCHISEE') && (
                    <>
                      <div className="border-t" />
                      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-neutral-500">
                        Espace franchisée
                      </div>
                      <Link
                        to="/franchisée/dashboard"
                        className="block px-4 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Tableau de bord
                      </Link>
                      <Link
                        to="/franchisée/stock"
                        className="block px-4 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Stocks
                      </Link>
                      <Link
                        to="/franchisée/events"
                        className="block px-4 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Gestion des événements
                      </Link>
                      <Link
                        to="/franchisée/events/new"
                        className="block px-4 py-2 text-sm hover:bg-neutral-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Créer un événement
                      </Link>
                    </>
                  )}

                  <div className="border-t" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login" className="px-3 py-1.5 rounded-md border hover:bg-neutral-50">
                Se connecter
              </NavLink>
              <NavLink
                to="/register"
                className="hidden sm:inline px-3 py-1.5 rounded-md bg-black text-white hover:bg-neutral-800"
              >
                Créer un compte
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="px-2 py-2 flex flex-col">
            <NavLink to="/client/menu" onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
              Menu
            </NavLink>
            <NavLink to="/client/cart" onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
              Panier {cartCount > 0 ? `(${cartCount})` : ''}
            </NavLink>
            <NavLink to="/client/order/my" onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
              Mes commandes
            </NavLink>
<<<<<<< HEAD
            <NavLink to="/franchisée/events" onClick={() => setMobileOpen(false)}
=======
            <NavLink to="/events" onClick={() => setMobileOpen(false)}
>>>>>>> cab8b67 (front final)
              className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
              Événements
            </NavLink>
            <NavLink to="/devenir-franchisee" onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
              Devenir franchisée
            </NavLink>

            {user && hasRole('FRANCHISEE') && (
              <>
                <div className="border-t my-2" />
                <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-neutral-500">
                  Espace franchisée
                </div>
                <NavLink to="/franchisée/dashboard" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  Tableau de bord
                </NavLink>
                <NavLink to="/franchisée/stock" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  Stocks
                </NavLink>
                <NavLink to="/franchisée/events" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  Gestion des événements
                </NavLink>
                <NavLink to="/franchisée/events/new" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  Créer un événement
                </NavLink>
              </>
            )}

            {user ? (
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 mt-2"
              >
                Se déconnecter
              </button>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  Se connecter
                </NavLink>
                <NavLink to="/register" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  Créer un compte
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}