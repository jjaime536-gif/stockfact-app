import React, { useState, useMemo } from 'react'
import { Card, Btn, Badge, Table, Modal, Input, Select, formatPeso } from '../components/UI'
import { upsertProducto, deleteProducto, ajusteStock, getEmpresa } from '../supabase'
import { getAlicuotas, getAlicuotaDefault } from '../utils/iva'

const CATEGORIAS = ['General', 'Insumos', 'Productos', 'Servicios']
const UNIDADES   = ['unidad', 'kg', 'lt', 'm2', 'm', 'hora', 'caja', 'rollo']

const EMPTY = { codigo: '', nombre: '', descripcion: '', categoria: 'General', unidad: 'unidad', precio_venta: '', costo: '', alicuota_iva: 21, stock_actual: 0, stock_minimo: 0 }

export default function Stock({ productos, recargar, empresa }) {
  const alicuotas = useMemo(() => getAlicuotas(empresa?.condicion_iva), [empresa])
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [modalAjuste, setModalAjuste] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [ajuste, setAjuste] = useState({ tipo: 'ajuste_positivo', cantidad: '', motivo: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const filtrados = productos.filter(p =>
    (!busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase())) &&
    (!catFiltro || p.categoria === catFiltro)
  )

  const abrirNuevo = () => { setForm(EMPTY); setError(''); setModal(true) }
  const abrirEditar = (p) => { setForm({ ...p }); setError(''); setModal(true) }

  const guardar = async () => {
    if (!form.nombre) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    const { data: emp } = await getEmpresa()
    const { error: e } = await upsertProducto({ ...form, empresa_id: emp.id, precio_venta: parseFloat(form.precio_venta) || 0, costo: parseFloat(form.costo) || 0 })
    if (e) setError(e.message)
    else { setModal(false); recargar() }
    setGuardando(false)
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Desactivar este producto?')) return
    await deleteProducto(id); recargar()
  }

  const guardarAjuste = async () => {
    if (!ajuste.cantidad || parseFloat(ajuste.cantidad) <= 0) { setError('Ingresá una cantidad válida'); return }
    setGuardando(true)
    const { error: e } = await ajusteStock(modalAjuste.id, parseFloat(ajuste.cantidad), ajuste.tipo, ajuste.motivo)
    if (e) setError(e.message)
    else { setModalAjuste(null); recargar() }
    setGuardando(false)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      {/* Barra de búsqueda */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <input
          placeholder="Buscar por nombre o código..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}
        />
        <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
          style={{ padding: '8px 10px', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <Btn primary onClick={abrirNuevo}>+ Nuevo producto</Btn>
      </div>

      <Card>
        <Table
          headers={['Código', 'Producto', 'Categoría', 'P. Venta', 'Costo', 'Stock', 'Mín.', 'Estado', '']}
          emptyMsg="No hay productos. Creá el primero."
          rows={filtrados.map(p => {
            const bajo = p.stock_actual <= p.stock_minimo && p.categoria !== 'Servicios'
            return {
              cells: [
                <code style={{ fontSize: 11 }}>{p.codigo}</code>,
                p.nombre,
                <Badge type="gray">{p.categoria}</Badge>,
                formatPeso(p.precio_venta),
                formatPeso(p.costo),
                <span style={{ color: bajo ? 'var(--red)' : 'var(--green)', fontWeight: bajo ? 600 : 400 }}>
                  {p.stock_actual} {p.unidad}
                </span>,
                p.stock_minimo,
                p.categoria === 'Servicios'
                  ? <Badge type="info">Servicio</Badge>
                  : bajo ? <Badge type="danger">Stock bajo</Badge> : <Badge type="success">Normal</Badge>,
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn sm onClick={() => { setAjuste({ tipo: 'ajuste_positivo', cantidad: '', motivo: '' }); setError(''); setModalAjuste(p) }}>± Ajuste</Btn>
                  <Btn sm onClick={() => abrirEditar(p)}>✎</Btn>
                  <Btn sm danger onClick={() => eliminar(p.id)}>✕</Btn>
                </div>
              ]
            }
          })}
        />
      </Card>

      {/* Modal producto */}
      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Editar producto' : 'Nuevo producto'}
        footer={<><Btn onClick={() => setModal(false)}>Cancelar</Btn><Btn primary onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Btn></>}>
        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <Input label="Código" value={form.codigo} onChange={e => f('codigo', e.target.value)} placeholder="Ej: ART-001" />
          <Select label="Categoría" value={form.categoria} onChange={e => f('categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <Input label="Nombre / Descripción" value={form.nombre} onChange={e => f('nombre', e.target.value)} placeholder="Nombre del producto o servicio" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <Input label="Precio venta" type="number" value={form.precio_venta} onChange={e => f('precio_venta', e.target.value)} />
          <Input label="Costo" type="number" value={form.costo} onChange={e => f('costo', e.target.value)} />
          <Select label="IVA" value={form.alicuota_iva} onChange={e => f('alicuota_iva', parseFloat(e.target.value))}>
            {alicuotas.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
          </Select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <Input label="Stock actual" type="number" value={form.stock_actual} onChange={e => f('stock_actual', parseFloat(e.target.value) || 0)} />
          <Input label="Stock mínimo" type="number" value={form.stock_minimo} onChange={e => f('stock_minimo', parseFloat(e.target.value) || 0)} />
          <Select label="Unidad" value={form.unidad} onChange={e => f('unidad', e.target.value)}>
            {UNIDADES.map(u => <option key={u}>{u}</option>)}
          </Select>
        </div>
      </Modal>

      {/* Modal ajuste stock */}
      <Modal open={!!modalAjuste} onClose={() => setModalAjuste(null)} title={`Ajuste de stock — ${modalAjuste?.nombre}`}
        footer={<><Btn onClick={() => setModalAjuste(null)}>Cancelar</Btn><Btn primary onClick={guardarAjuste} disabled={guardando}>{guardando ? 'Guardando…' : 'Confirmar'}</Btn></>}>
        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {modalAjuste && <div style={{ marginBottom: 10, fontSize: 13, color: 'var(--text2)' }}>
          Stock actual: <strong>{modalAjuste.stock_actual} {modalAjuste.unidad}</strong>
        </div>}
        <Select label="Tipo de ajuste" value={ajuste.tipo} onChange={e => setAjuste(a => ({ ...a, tipo: e.target.value }))}>
          <option value="ajuste_positivo">Entrada / suma</option>
          <option value="ajuste_negativo">Salida / resta</option>
        </Select>
        <Input label="Cantidad" type="number" value={ajuste.cantidad} onChange={e => setAjuste(a => ({ ...a, cantidad: e.target.value }))} />
        <Input label="Motivo" value={ajuste.motivo} onChange={e => setAjuste(a => ({ ...a, motivo: e.target.value }))} placeholder="Ej: Compra de mercadería, merma, etc." />
      </Modal>
    </div>
  )
}
