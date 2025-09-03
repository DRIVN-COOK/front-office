import { NavLink, Outlet } from 'react-router-dom'

const base = 'px-3 py-2 rounded-lg'
const link = base + ' hover:bg-gray-100'
const active = base + ' bg-gray-900 text-white hover:bg-gray-900'

export default function FranchiseeLayout() {
  return (
    <div className="min-h-screen grid md:grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-3">
        <div className="text-lg font-bold">Espace Franchisé</div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/franchisée/dashboard" className={({isActive}) => isActive ? active : link}>Dashboard</NavLink>
          <NavLink to="/franchisée/orders/board" className={({isActive}) => isActive ? active : link}>Commandes</NavLink>
          <NavLink to="/franchisée/events" className={({isActive}) => isActive ? active : link}>Événements</NavLink>
          <NavLink to="/franchisée/procurement" className={({isActive}) => isActive ? active : link}>Appro</NavLink>
          <NavLink to="/franchisée/billing" className={({isActive}) => isActive ? active : link}>Facturation</NavLink>
          <NavLink to="/franchisée/reporting" className={({isActive}) => isActive ? active : link}>Reporting</NavLink>
        </nav>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
