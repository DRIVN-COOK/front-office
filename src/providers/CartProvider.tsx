import React from 'react'

export type CartItem = {
  menuItemId: string
  name: string
  imageUrl?: string
  unitPriceHT: number
  tvaPct: number
  qty: number
}

type CartContextValue = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (menuItemId: string) => void
  setQty: (menuItemId: string, qty: number) => void
  clear: () => void
  totalHT: number
  totalTVA: number
  totalTTC: number
}

const CartContext = React.createContext<CartContextValue | undefined>(undefined)
const LS_KEY = 'drivn_cart_v2'

function load(): CartItem[] { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
function save(items: CartItem[]) { localStorage.setItem(LS_KEY, JSON.stringify(items)) }

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>(load)
  React.useEffect(() => { save(items) }, [items])

  const add = React.useCallback((p: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems(prev => {
      const i = prev.findIndex(it => it.menuItemId === p.menuItemId)
      if (i >= 0) {
        const next = [...prev]; next[i] = { ...next[i], qty: next[i].qty + qty }; return next
      }
      return [...prev, { ...p, qty }]
    })
  }, [])

  const remove = React.useCallback((menuItemId: string) => {
    setItems(prev => prev.filter(it => it.menuItemId !== menuItemId))
  }, [])

  const setQty = React.useCallback((menuItemId: string, qty: number) => {
    setItems(prev => prev.map(it => it.menuItemId === menuItemId ? { ...it, qty: Math.max(1, qty) } : it))
  }, [])

  const clear = React.useCallback(() => setItems([]), [])

  const totalHT = React.useMemo(() =>
    items.reduce((s, it) => s + it.unitPriceHT * it.qty, 0), [items])
  const totalTVA = React.useMemo(() =>
    items.reduce((s, it) => s + it.unitPriceHT * it.qty * (it.tvaPct / 100), 0), [items])
  const totalTTC = totalHT + totalTVA

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, totalHT, totalTVA, totalTTC }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
