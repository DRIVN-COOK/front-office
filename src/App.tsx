// src/App.tsx
import { lazy, Suspense, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import './index.css'
import './App.css'

import { AuthProvider, useAuth, setApiBaseUrl } from '@drivn-cook/shared'
import { API_URL } from './config'
setApiBaseUrl(API_URL) // important: avant tout rendu

import { CartProvider } from './providers/CartProvider'
import Header from './components/Header'
import PublicEventsPage from './pages/franchisee/events/PublicEventsPage'
import FranchiseAdhesionPage from './pages/franchisee/adhesion/FranchiseAdhesionPage'

// Pages publiques/générales
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

// Espace CLIENT (utilisateurs en général)
const MenuPage = lazy(() => import('./pages/clients/menu/MenuPage'))
const MenuItemDetailPage = lazy(() => import('./pages/clients/menu/MenuItemDetailPage'))
const CartPage = lazy(() => import('./pages/clients/cart/CartPage'))
const CheckoutPage = lazy(() => import('./pages/clients/order/CheckoutPage')) // <- Paiement (Embedded/Hosted)
const OrderConfirmationPage = lazy(() => import('./pages/clients/order/OrderConfirmationPage'))
const MyOrdersPage = lazy(() => import('./pages/clients/order/MyOrdersPage'))

// Espace FRANCHISÉE
const FranchiseeLayout       = lazy(() => import('./components/layout/FranchiseeLayout'))
const DashboardPage          = lazy(() => import('./pages/franchisee/DashboardPage'))
const OrdersListPage         = lazy(() => import('./pages/franchisee/orders/ListPage'))
const OrderDetailPage        = lazy(() => import('./pages/franchisee/orders/DetailPage'))
const LiveOrdersBoardPage    = lazy(() => import('./pages/franchisee/orders/LiveOrdersBoardPage'))
const PurchaseOrderListPage  = lazy(() => import('./pages/franchisee/procurement/PurchaseOrderListPage'))
const InvoicesPage           = lazy(() => import('./pages/franchisee/billing/InvoicesPage'))
const SalesSummaryPage       = lazy(() => import('./pages/franchisee/reporting/SalesSummaryPage'))
const CreateEventPage        = lazy(() => import('./pages/franchisee/events/CreatePage'))
const EventsManagementPage   = lazy(() => import('./pages/franchisee/events/EventsManagementPage'))
const StockPage              = lazy(() => import('./pages/franchisee/stock/StockPage'))

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth() as any
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ role, children }: { role: string; children: ReactElement }) {
  const { user, isLoading } = useAuth() as any
  if (isLoading) return null
  const roles: string[] = user?.roles ?? (user?.role ? [user.role] : [])
  if (!roles.includes(role)) return <Navigate to="/" replace />
  return children
}

function Shell({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <Suspense fallback={<div className="p-4">Chargement…</div>}>
          {children}
        </Suspense>
      </main>
      <footer className="px-4 py-3 border-t text-sm opacity-70">© DRIVN-COOK</footer>
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Shell>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/devenir-franchisee" element={<FranchiseAdhesionPage />} />
              <Route path="/events" element={<PublicEventsPage />} /> {/* événements publics */}

              {/* Profil pour tout utilisateur connecté */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* ===== Espace CLIENT ===== */}
              <Route path="/client/menu" element={<MenuPage />} />
              <Route path="/client/menu/:id" element={<MenuItemDetailPage />} />
              <Route path="/client/cart" element={<CartPage />} />

              {/* Paiement commande client (Stripe Embedded/Hosted) */}
              <Route
                path="/client/order/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              {/* Alias retours Stripe */}
              <Route
                path="/client/order/checkout/return"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/order/checkout/success"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/order/checkout/cancel"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />

              {/* Confirmation (si utilisée ailleurs) */}
              <Route
                path="/client/order/confirmation/:id"
                element={
                  <ProtectedRoute>
                    <OrderConfirmationPage />
                  </ProtectedRoute>
                }
              />

              {/* Mes commandes */}
              <Route
                path="/client/order/my"
                element={
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
              {/* Alias pour compat navigate('/client/orders') */}
              <Route path="/client/orders" element={<Navigate to="/client/order/my" replace />} />

              {/* ===== Espace FRANCHISÉE ===== */}
              {/* Alias ASCII (sécurité) */}
              <Route path="/franchisee/*" element={<Navigate to="/franchisée" replace />} />

              <Route
                path="/franchisée"
                element={
                  <ProtectedRoute>
                    <RoleRoute role="FRANCHISEE">
                      <FranchiseeLayout />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="orders/board" element={<LiveOrdersBoardPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="orders" element={<OrdersListPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="events" element={<EventsManagementPage />} />
                {/* Création dédiée (si tu gardes la page séparée) */}
                <Route path="events/new" element={<CreateEventPage />} />

                <Route path="procurement" element={<PurchaseOrderListPage />} />
                <Route path="billing" element={<InvoicesPage />} />
                <Route path="reporting" element={<SalesSummaryPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
