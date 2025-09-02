import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="container-qp">
      <h1 className="text-2xl font-bold mb-4">Espace franchisé</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <section className="card">
          <div className="card-header">Tableau de bord</div>
          <div className="card-body">
            <p className="text-muted">Vue d’ensemble des commandes et du CA.</p>
            <div className="mt-3">
              <Link to="/franchisée/dashboard" className="underline">Dashboard</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Commandes</div>
          <div className="card-body">
            <p className="text-muted">Suivi des commandes en cours et historiques.</p>
            <div className="mt-3 space-x-3">
              <Link to="/franchisée/orders" className="underline">Lister</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Fidélité</div>
          <div className="card-body">
            <p className="text-muted">Cartes et transactions de points.</p>
            <div className="mt-3">
              <Link to="/franchisée/loyalty" className="underline">Cartes</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Événements</div>
          <div className="card-body">
            <p className="text-muted">Organisation et communication locale.</p>
            <div className="mt-3 space-x-3">
              <Link to="/franchisée/events" className="underline">Liste</Link>
              <Link to="/franchisée/events/create" className="underline">Créer</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Approvisionnement</div>
          <div className="card-body">
            <p className="text-muted">Bons d’appro et suivi de statut.</p>
            <div className="mt-3">
              <Link to="/franchisée/procurement" className="underline">Bons d’appro</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Facturation</div>
          <div className="card-body">
            <p className="text-muted">Factures et téléchargements PDF.</p>
            <div className="mt-3">
              <Link to="/franchisée/invoices" className="underline">Mes factures</Link>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Reporting</div>
          <div className="card-body">
            <p className="text-muted">Ventes, commandes et tendances.</p>
            <div className="mt-3">
              <Link to="/franchisée/reporting" className="underline">Résumés de ventes</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
