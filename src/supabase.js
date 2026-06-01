import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Empresas ──────────────────────────────────────────────
export const getEmpresa = async (empresaId) => {
  let q = supabase.from('empresas').select('*')
  if (empresaId) q = q.eq('id', empresaId)
  else q = q.limit(1)
  const { data, error } = await q.single()
  return { data, error }
}

export const updateEmpresa = async (id, updates) => {
  const { data, error } = await supabase.from('empresas').update(updates).eq('id', id).select().single()
  return { data, error }
}

// ── Clientes ──────────────────────────────────────────────
export const getClientes = async (empresaId) => {
  let q = supabase.from('clientes').select('*').eq('activo', true).order('nombre')
  if (empresaId) q = q.eq('empresa_id', empresaId)
  const { data, error } = await q
  return { data: data || [], error }
}

export const upsertCliente = async (cliente) => {
  const { data, error } = await supabase.from('clientes').upsert(cliente).select().single()
  return { data, error }
}

// ── Productos ─────────────────────────────────────────────
export const getProductos = async (empresaId) => {
  let q = supabase.from('productos').select('*').eq('activo', true).order('nombre')
  if (empresaId) q = q.eq('empresa_id', empresaId)
  const { data, error } = await q
  return { data: data || [], error }
}

export const upsertProducto = async (producto) => {
  const { data, error } = await supabase.from('productos').upsert(producto).select().single()
  return { data, error }
}

export const deleteProducto = async (id) => {
  const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id)
  return { error }
}

// ── Comprobantes ──────────────────────────────────────────
export const getComprobantes = async (empresaId) => {
  let q = supabase.from('comprobantes').select('*, clientes(nombre, cuit_dni)').order('created_at', { ascending: false }).limit(200)
  if (empresaId) q = q.eq('empresa_id', empresaId)
  const { data, error } = await q
  return { data: data || [], error }
}

export const getComprobante = async (id) => {
  const { data, error } = await supabase
    .from('comprobantes')
    .select('*, clientes(*), items_comprobante(*, productos(nombre, codigo))')
    .eq('id', id)
    .single()
  return { data, error }
}

export const crearComprobante = async (comprobante, items) => {
  // 1. Obtener siguiente número
  const { data: numData } = await supabase.rpc('next_numero_comprobante', {
    p_empresa_id: comprobante.empresa_id,
    p_tipo: comprobante.tipo,
    p_punto_venta: comprobante.punto_venta
  })
  const numero = numData || 1

  // 2. Insertar comprobante
  const { data: comp, error: compError } = await supabase
    .from('comprobantes')
    .insert({ ...comprobante, numero })
    .select()
    .single()
  if (compError) return { data: null, error: compError }

  // 3. Insertar items
  const itemsConId = items.map((item, i) => ({
    ...item,
    comprobante_id: comp.id,
    orden: i + 1
  }))
  const { error: itemsError } = await supabase.from('items_comprobante').insert(itemsConId)
  if (itemsError) return { data: null, error: itemsError }

  // 4. Descontar stock
  await supabase.rpc('descontar_stock_por_comprobante', { p_comprobante_id: comp.id })

  return { data: comp, error: null }
}

export const updateEstadoComprobante = async (id, estado) => {
  const { data, error } = await supabase.from('comprobantes').update({ estado }).eq('id', id).select().single()
  return { data, error }
}

// ── Movimientos de stock ──────────────────────────────────
export const getMovimientos = async (productoId) => {
  let q = supabase.from('movimientos_stock').select('*, productos(nombre)').order('created_at', { ascending: false }).limit(100)
  if (productoId) q = q.eq('producto_id', productoId)
  const { data, error } = await q
  return { data: data || [], error }
}

export const ajusteStock = async (productoId, cantidad, tipo, motivo) => {
  const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', productoId).single()
  const anterior = prod?.stock_actual || 0
  const delta = tipo === 'ajuste_positivo' ? cantidad : -cantidad
  const posterior = anterior + delta

  await supabase.from('productos').update({ stock_actual: posterior }).eq('id', productoId)
  const { error } = await supabase.from('movimientos_stock').insert({
    producto_id: productoId, tipo, cantidad, stock_anterior: anterior, stock_posterior: posterior, motivo
  })
  return { error }
}

// ── Reportes ──────────────────────────────────────────────
export const getReporteVentas = async (desde, hasta) => {
  const { data, error } = await supabase
    .from('comprobantes')
    .select('*, clientes(nombre)')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .in('tipo', ['FA', 'FB', 'FC', 'ticket'])
    .order('fecha', { ascending: false })
  return { data: data || [], error }
}

// ── Logo ──────────────────────────────────────────────────
export const subirLogo = async (empresaId, file) => {
  const ext = file.name.split('.').pop()
  const path = `${empresaId}/logo.${ext}`
  
  // Subir archivo
  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true })
  
  if (uploadError) return { url: null, error: uploadError }
  
  // Obtener URL publica
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  const url = data.publicUrl + '?t=' + Date.now()
  
  // Guardar URL en la empresa
  await supabase.from('empresas').update({ logo_url: url.split('?')[0] }).eq('id', empresaId)
  
  return { url, error: null }
}
