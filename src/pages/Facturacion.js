import React, { useState, useMemo } from 'react'
import { Card, CardTitle, Btn, Badge, Table, Input, Select, Grid, formatPeso, formatFecha } from '../components/UI'
import { crearComprobante, updateEstadoComprobante, getEmpresa, getComprobante } from '../supabase'
import { imprimirComprobante } from '../components/ComprobantePDF'
import { getAlicuotaDefault, esSinIva } from '../utils/iva'

const TIPOS = [
  { v: 'FA', l: 'Factura A' }, { v: 'FB', l: 'Factura B' }, { v: 'FC', l: 'Factura C' },
  { v: 'NCA', l: 'Nota de Crédito A' }, { v: 'NCB', l: 'Nota de Crédito B' },
  { v: 'ticket', l: 'Ticket' }
]

const badgeEstado = e => {
  const m = { cobrada: 'success', pendiente: 'warning', vencida: 'danger', anulada: 'gray' }
  return <Badge type={m[e]||'gray'}>{e}</Badge>
}

export default function Facturacion({ empresa, clientes, productos, comprobantes, recargar }) {
  const sinIva    = useMemo(() => esSinIva(empresa?.condicion_iva), [empresa])
  const aDefault  = useMemo(() => getAlicuotaDefault(empresa?.condicion_iva), [empresa])

  const [tipo, setTipo]       = useState('FB')
  const [pv, setPv]           = useState(1)
  const [clienteId, setClienteId] = useState('')
  const [condPago, setCondPago]   = useState('Contado')
  const [fecha, setFecha]     = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs]         = useState('')
  const [items, setItems]     = useState([{ descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: aDefault, producto_id: null }])
  const [emitiendo, setEmitiendo] = useState(false)
  const [cargandoPDF, setCargandoPDF] = useState(false)
  const [error, setError]     = useState('')

  const totales = items.reduce((acc, it) => {
    const neto = (parseFloat(it.cantidad)||0) * (parseFloat(it.precio_unitario)||0)
    const iva  = sinIva ? 0 : neto * (parseFloat(it.alicuota_iva)||0) / 100
    return { neto: acc.neto + neto, iva: acc.iva + iva, total: acc.total + neto + iva }
  }, { neto: 0, iva: 0, total: 0 })

  const setItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const quitarItem = i => setItems(p => p.filter((_, idx) => idx !== i))
  const agregarItem = () => setItems(p => [...p, { descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: aDefault, producto_id: null }])

  const selProducto = (i, prodId) => {
    const p = productos.find(p => p.id === prodId)
    if (!p) { setItem(i, 'producto_id', null); setItem(i, 'descripcion', ''); return }
    setItem(i, 'producto_id', prodId)
    setItem(i, 'descripcion', p.nombre)
    setItem(i, 'precio_unitario', p.precio_venta)
    setItem(i, 'alicuota_iva', p.alicuota_iva)
  }

  const abrirPDF = async (id) => {
    setCargandoPDF(id)
    const { data } = await getComprobante(id)
    if (data) imprimirComprobante(data, empresa)
    setCargandoPDF(false)
  }

  const emitir = async () => {
    if (items.some(it => !it.descripcion)) { setError('Todos los items deben tener descripción'); return }
    setEmitiendo(true); setError('')
    const { data: emp } = await getEmpresa()
    const comp = {
      empresa_id: emp.id, cliente_id: clienteId || null,
      tipo, punto_venta: pv, fecha, condicion_pago: condPago, moneda: 'ARS',
      subtotal: totales.neto, iva_total: totales.iva, otros_tributos: 0, total: totales.total,
      estado: 'pendiente', observaciones: obs
    }
    const itemsData = items.map(it => ({
      producto_id: it.producto_id || null,
      descripcion: it.descripcion,
      cantidad: parseFloat(it.cantidad)||1,
      precio_unitario: parseFloat(it.precio_unitario)||0,
      alicuota_iva: parseFloat(it.alicuota_iva)||21,
      subtotal_neto: (parseFloat(it.cantidad)||1) * (parseFloat(it.precio_unitario)||0),
      iva_monto: (parseFloat(it.cantidad)||1) * (parseFloat(it.precio_unitario)||0) * (parseFloat(it.alicuota_iva)||21)/100,
      subtotal: (parseFloat(it.cantidad)||1) * (parseFloat(it.precio_unitario)||0) * (1 + (parseFloat(it.alicuota_iva)||21)/100),
    }))
    const { data, error: e } = await crearComprobante(comp, itemsData)
    if (e) { setError(e.message); setEmitiendo(false); return }
    recargar()
    setItems([{ descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: aDefault, producto_id: null }])
    setObs(''); setClienteId('')
    setEmitiendo(false)
    // Abrir PDF automaticamente
    const { data: compCompleto } = await getComprobante(data.id)
    if (compCompleto) imprimirComprobante(compCompleto, emp)
  }

  const cambiarEstado = async (id, estado) => {
    await updateEstadoComprobante(id, estado); recargar()
  }

  return (
    <div>
      <div style={{ background:'var(--blue-light)', border:'0.5px solid #B5D4F4', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--blue)' }}>
        ℹ Modo local — los comprobantes se guardan en tu base de datos. Para emitir con CAE real conectá ARCA.
      </div>

      <Grid cols={2} gap={16}>
        <div>
          <Card style={{ marginBottom:16 }}>
            <CardTitle>Datos del comprobante</CardTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              <Select label="Tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </Select>
              <Select label="Punto de venta" value={pv} onChange={e => setPv(parseInt(e.target.value))}>
                <option value={1}>0001</option><option value={2}>0002</option>
              </Select>
            </div>
            <Select label="Cliente" value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">— Consumidor Final —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.cuit_dni ? ` — ${c.cuit_dni}` : ''}</option>)}
            </Select>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              <Select label="Condición de pago" value={condPago} onChange={e => setCondPago(e.target.value)}>
                {['Contado','30 días','60 días','Cuenta corriente'].map(c => <option key={c}>{c}</option>)}
              </Select>
              <Input label="Fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text2)', marginBottom:5 }}>Observaciones</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Notas para el comprobante..."
                style={{ width:'100%', padding:'8px 10px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:13, fontFamily:'inherit', resize:'vertical', minHeight:60 }} />
            </div>
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom:16 }}>
            <CardTitle>Items del comprobante</CardTitle>
            <div style={{ display:'grid', gridTemplateColumns: sinIva ? '2fr 60px 120px 28px' : '2fr 60px 100px 80px 28px', gap:6, marginBottom:6 }}>
              {(sinIva ? ['Descripción','Cant.','P. Total',''] : ['Descripción','Cant.','P.Unit.','IVA','']).map((h,i) =>
                <span key={i} style={{ fontSize:11, color:'var(--text2)' }}>{h}</span>)}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ marginBottom:6 }}>
                <div style={{ display:'grid', gridTemplateColumns: sinIva ? '2fr 60px 120px 28px' : '2fr 60px 100px 80px 28px', gap:6, alignItems:'center' }}>
                  <select value={it.producto_id || ''} onChange={e => selProducto(i, e.target.value || null)}
                    style={{ padding:'6px 8px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:12, fontFamily:'inherit' }}>
                    <option value="">— Libre —</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <input type="number" value={it.cantidad} min={1} onChange={e => setItem(i,'cantidad',e.target.value)}
                    style={{ padding:'6px 8px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:12 }} />
                  <input type="number" value={it.precio_unitario} onChange={e => setItem(i,'precio_unitario',e.target.value)}
                    style={{ padding:'6px 8px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:12 }} />
                  {!sinIva && (
                    <select value={it.alicuota_iva} onChange={e => setItem(i,'alicuota_iva',e.target.value)}
                      style={{ padding:'6px 4px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:11 }}>
                      {[{v:0,l:'0%'},{v:2.5,l:'2,5%'},{v:5,l:'5%'},{v:10.5,l:'10,5%'},{v:21,l:'21%'},{v:27,l:'27%'}].map(a =>
                        <option key={a.v} value={a.v}>{a.l}</option>)}
                    </select>
                  )}
                  <Btn sm danger onClick={() => quitarItem(i)}>✕</Btn>
                </div>
                {!it.producto_id && (
                  <input placeholder="Descripción del item..." value={it.descripcion} onChange={e => setItem(i,'descripcion',e.target.value)}
                    style={{ width:'100%', marginTop:4, padding:'6px 8px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:12, fontFamily:'inherit' }} />
                )}
              </div>
            ))}
            <Btn sm onClick={agregarItem} style={{ marginTop:8 }}>+ Agregar item</Btn>
            <div style={{ borderTop:'0.5px solid var(--border)', marginTop:14, paddingTop:14 }}>
              {[['Subtotal neto', totales.neto],['IVA', totales.iva]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'var(--text2)' }}>{l}</span><span>{formatPeso(v)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:600, fontSize:16, paddingTop:8, borderTop:'0.5px solid var(--border)' }}>
                <span>Total</span><span>{formatPeso(totales.total)}</span>
              </div>
            </div>
          </Card>
          {error && <div style={{ color:'var(--red)', fontSize:12, marginBottom:10 }}>{error}</div>}
          <Btn primary onClick={emitir} disabled={emitiendo} style={{ width:'100%' }}>
            {emitiendo ? 'Emitiendo…' : '▶ Emitir comprobante'}
          </Btn>
        </div>
      </Grid>

      <Card style={{ marginTop:20 }}>
        <CardTitle>Comprobantes emitidos</CardTitle>
        <Table
          headers={['N°','Tipo','Fecha','Cliente','Total','CAE','Estado','']}
          emptyMsg="Aún no hay comprobantes"
          rows={comprobantes.slice(0,50).map(c => ({
            cells: [
              `${String(c.punto_venta||1).padStart(4,'0')}-${String(c.numero||0).padStart(8,'0')}`,
              TIPOS.find(t=>t.v===c.tipo)?.l || c.tipo,
              formatFecha(c.fecha),
              c.clientes?.nombre || 'Consumidor Final',
              formatPeso(c.total),
              c.cae ? <Badge type="success">CAE ✓</Badge> : <Badge type="gray">Local</Badge>,
              badgeEstado(c.estado),
              <div style={{ display:'flex', gap:4 }}>
                <Btn sm onClick={() => abrirPDF(c.id)} disabled={cargandoPDF === c.id}>
                  {cargandoPDF === c.id ? '…' : '🖨 PDF'}
                </Btn>
                {c.estado === 'pendiente' && (
                  <Btn sm onClick={() => cambiarEstado(c.id,'cobrada')}>✓ Cobrar</Btn>
                )}
              </div>
            ]
          }))}
        />
      </Card>
    </div>
  )
}
