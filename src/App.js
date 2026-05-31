import React, { useState, useEffect, useCallback } from 'react'
import { getProductos, getClientes, getComprobantes, getEmpresa } from './supabase'
import Dashboard from './pages/Dashboard'
import Stock from './pages/Stock'
import Facturacion from './pages/Facturacion'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import ARCA from './pages/ARCA'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'stock',     label: 'Stock',     icon: '▣' },
  { id: 'factura',   label: 'Facturación', icon: '▤' },
  { id: 'reportes',  label: 'Reportes',  icon: '▧' },
  { id: 'config',    label: 'Configuración', icon: '⚙' },
  { id: 'arca',      label: 'ARCA / AFIP', icon: '⊕' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [empresa, setEmpresa] = useState(null)
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [comprobantes, setComprobantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [emp, prods, clis, comps] = await Promise.all([
        getEmpresa(), getProductos(), getClientes(), getComprobantes()
      ])
      if (emp.error && emp.error.code !== 'PGRST116') setError('No se pudo conectar con Supabase')
      setEmpresa(emp.data)
      setProductos(prods.data)
      setClientes(clis.data)
      setComprobantes(comps.data)
    } catch (e) {
      setError('Error de conexión: ' + e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const pageProps = { empresa, productos, clientes, comprobantes, recargar: cargarDatos }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 200, background: 'var(--bg)', borderRight: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>StockFact AR</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {empresa?.razon_social || 'Sin configurar'}
          </div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 16px', background: page === n.id ? 'var(--blue-light)' : 'transparent',
              color: page === n.id ? 'var(--blue)' : 'var(--text2)',
              border: 'none', borderLeft: `2px solid ${page === n.id ? 'var(--blue)' : 'transparent'}`,
              cursor: 'pointer', fontSize: 13, textAlign: 'left', fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>
          <div>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: error ? '#E24B4A' : '#639922', marginRight: 6 }}/>
            {error ? 'Sin conexión' : 'Supabase conectado'}
          </div>
          <div style={{ marginTop: 4 }}>ARCA: pendiente config.</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          background: 'var(--bg)', borderBottom: '0.5px solid var(--border)',
          padding: '12px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 500 }}>
            {NAV.find(n => n.id === page)?.label}
          </h1>
          {loading && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Actualizando…</span>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
          {error && (
            <div style={{
              background: 'var(--red-light)', border: '0.5px solid #F09595',
              borderRadius: 'var(--radius)', padding: '12px 16px',
              color: 'var(--red)', fontSize: 13, marginBottom: 16
            }}>
              ⚠ {error} — Verificá la URL y key de Supabase en el archivo .env
            </div>
          )}
          {page === 'dashboard'  && <Dashboard {...pageProps} />}
          {page === 'stock'      && <Stock {...pageProps} />}
          {page === 'factura'    && <Facturacion {...pageProps} />}
          {page === 'reportes'   && <Reportes {...pageProps} />}
          {page === 'config'     && <Configuracion {...pageProps} />}
          {page === 'arca'       && <ARCA {...pageProps} />}
        </div>
      </main>
    </div>
  )
}
