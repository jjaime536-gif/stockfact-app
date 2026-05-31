import React from 'react'

const fmt  = (n) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
const fmtFecha = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '-'

const TIPOS_LABEL = {
  FA: 'FACTURA A', FB: 'FACTURA B', FC: 'FACTURA C',
  NCA: 'NOTA DE CRÉDITO A', NCB: 'NOTA DE CRÉDITO B', NCC: 'NOTA DE CRÉDITO C',
  ticket: 'TICKET'
}
const LETRA = { FA: 'A', FB: 'B', FC: 'C', NCA: 'A', NCB: 'B', NCC: 'C', ticket: 'T' }
const COD   = { FA: '01', FB: '06', FC: '11', NCA: '03', NCB: '08', NCC: '13', ticket: '83' }

// Tipos sin IVA: Factura C, NC C, ticket de monotributista
const SIN_IVA_TIPOS = ['FC', 'NCC', 'ticket']

export function imprimirComprobante(comprobante, empresa) {
  const numero = `${String(comprobante.punto_venta || 1).padStart(4, '0')}-${String(comprobante.numero || 0).padStart(8, '0')}`
  const letra  = LETRA[comprobante.tipo] || 'B'
  const cod    = COD[comprobante.tipo]   || '06'
  const items  = comprobante.items_comprobante || []
  const sinIva = SIN_IVA_TIPOS.includes(comprobante.tipo)

  // ── Tabla de items ────────────────────────────────────────
  const theadSinIva = `
    <tr>
      <th style="width:6%">Código</th>
      <th style="width:36%">Producto / Servicio</th>
      <th class="c" style="width:10%">Cantidad</th>
      <th class="c" style="width:10%">U. Medida</th>
      <th class="r" style="width:13%">Precio Unit.</th>
      <th class="c" style="width:8%">% Bonif</th>
      <th class="r" style="width:10%">Imp. Bonif.</th>
      <th class="r" style="width:12%">Subtotal</th>
    </tr>`

  const theadConIva = `
    <tr>
      <th style="width:38%">Descripción</th>
      <th class="c" style="width:10%">Cantidad</th>
      <th class="c" style="width:10%">U. Medida</th>
      <th class="r" style="width:15%">Precio Unit.</th>
      <th class="c" style="width:10%">IVA %</th>
      <th class="r" style="width:17%">Subtotal</th>
    </tr>`

  const itemsHTML = items.length > 0
    ? items.map((it, i) => {
        const bg = i % 2 === 0 ? '#fff' : '#f9f9f9'
        const subtotal = fmt(it.subtotal_neto || it.subtotal || 0)
        if (sinIva) {
          return `<tr style="background:${bg}; border-bottom:0.5px solid #ddd">
            <td style="padding:7px 8px; text-align:center">${i + 1}</td>
            <td style="padding:7px 8px">${it.descripcion}</td>
            <td style="padding:7px 8px; text-align:center">${fmt(it.cantidad)}</td>
            <td style="padding:7px 8px; text-align:center">${it.productos?.unidad || 'unidades'}</td>
            <td style="padding:7px 8px; text-align:right">${fmt(it.precio_unitario)}</td>
            <td style="padding:7px 8px; text-align:center">0,00</td>
            <td style="padding:7px 8px; text-align:right">0,00</td>
            <td style="padding:7px 8px; text-align:right">${fmt(it.precio_unitario * it.cantidad)}</td>
          </tr>`
        } else {
          return `<tr style="background:${bg}; border-bottom:0.5px solid #ddd">
            <td style="padding:7px 8px">${it.descripcion}</td>
            <td style="padding:7px 8px; text-align:center">${fmt(it.cantidad)}</td>
            <td style="padding:7px 8px; text-align:center">${it.productos?.unidad || 'unidades'}</td>
            <td style="padding:7px 8px; text-align:right">${fmt(it.precio_unitario)}</td>
            <td style="padding:7px 8px; text-align:center">${it.alicuota_iva}%</td>
            <td style="padding:7px 8px; text-align:right">${fmt(it.subtotal)}</td>
          </tr>`
        }
      }).join('')
    : `<tr><td colspan="${sinIva ? 8 : 6}" style="padding:16px; text-align:center; color:#888">Sin items</td></tr>`

  // ── Bloque de totales ─────────────────────────────────────
  const totalesHTML = sinIva
    ? `<div class="tot-row"><span>Subtotal:</span><span>$ ${fmt(comprobante.total)}</span></div>
       <div class="tot-row"><span>Importe Otros Tributos:</span><span>$ ${fmt(comprobante.otros_tributos || 0)}</span></div>
       <div class="tot-final"><span>Importe Total:</span><span>$ ${fmt(comprobante.total)}</span></div>`
    : `<div class="tot-row"><span>Subtotal neto:</span><span>$ ${fmt(comprobante.subtotal)}</span></div>
       <div class="tot-row"><span>IVA:</span><span>$ ${fmt(comprobante.iva_total)}</span></div>
       ${comprobante.otros_tributos > 0 ? `<div class="tot-row"><span>Otros tributos:</span><span>$ ${fmt(comprobante.otros_tributos)}</span></div>` : ''}
       <div class="tot-final"><span>Importe Total:</span><span>$ ${fmt(comprobante.total)}</span></div>`

  // ── CAE ───────────────────────────────────────────────────
  const caeHTML = comprobante.cae
    ? `<div style="display:flex; gap:40px">
         <div><strong>CAE N°:</strong> ${comprobante.cae}</div>
         <div><strong>Vto. CAE:</strong> ${fmtFecha(comprobante.cae_vencimiento)}</div>
       </div>`
    : `<div style="color:#999; font-style:italic">CAE pendiente — conectar ARCA/AFIP para emisión electrónica oficial</div>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${TIPOS_LABEL[comprobante.tipo] || 'Comprobante'} ${numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
    .wrapper { width: 720px; margin: 20px auto; border: 1px solid #ccc; }
    .btn-bar { background: #1a1a1a; padding: 10px 16px; display: flex; gap: 8px; justify-content: flex-end; }
    .btn { border: none; border-radius: 6px; padding: 7px 16px; cursor: pointer; font-size: 13px; font-weight: 500; }
    .btn-print { background: #185FA5; color: #fff; }
    .btn-close  { background: #444; color: #fff; }
    .header { display: flex; border-bottom: 2px solid #111; }
    .header-left   { flex: 1; padding: 14px 18px; border-right: 2px solid #111; }
    .header-center { width: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #111; padding: 8px 0; }
    .letra-box { width: 60px; height: 60px; border: 2px solid #111; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 700; margin-bottom: 4px; }
    .header-right  { flex: 1; padding: 14px 18px; }
    .razon { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .comp-title { font-weight: 700; font-size: 13px; margin-bottom: 8px; }
    .info { font-size: 10px; color: #444; line-height: 1.8; }
    .cond-venta { padding: 7px 18px; border-bottom: 1px solid #ccc; font-size: 10px; }
    .cliente-section { padding: 10px 18px; border-bottom: 1px solid #ccc; font-size: 10px; }
    .cliente-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead tr { background: #d0d0d0; color: #111; }
    th { padding: 6px 8px; text-align: left; border: 0.5px solid #bbb; font-weight: 600; }
    th.r { text-align: right; }
    th.c { text-align: center; }
    td { border: 0.5px solid #ddd; }
    .totales { display: flex; justify-content: flex-end; border-top: 1px solid #ccc; }
    .totales-inner { width: 300px; padding: 12px 18px; border-left: 2px solid #111; }
    .tot-row   { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; border-bottom: 0.5px solid #eee; }
    .tot-final { display: flex; justify-content: space-between; padding: 8px 0 2px; margin-top: 6px; font-weight: 700; font-size: 13px; }
    .cae { background: #f5f5f5; border-top: 1px solid #ccc; padding: 10px 18px; font-size: 10px; color: #555; }
    .pie { border-top: 1px solid #ccc; padding: 6px 18px; text-align: center; font-size: 9px; color: #888; }
    @media print {
      @page { margin: 10mm; size: A4; }
      .btn-bar { display: none !important; }
      .wrapper { margin: 0; border: none; width: 100%; }
      body { background: #fff; margin: 0; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="btn-bar">
    <button class="btn btn-print" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
    <button class="btn btn-close"  onclick="window.close()">✕ Cerrar</button>
  </div>

  <!-- ENCABEZADO -->
  <div class="header">
    <div class="header-left">
      <div class="razon">${empresa?.razon_social || 'Mi Empresa'}</div>
      <div class="info">
        <div>${empresa?.domicilio || ''}</div>
        <div>Condición IVA: ${empresa?.condicion_iva || 'Responsable Inscripto'}</div>
        <div>CUIT: ${empresa?.cuit || '—'}</div>
        ${empresa?.inicio_actividades ? `<div>Inicio de actividades: ${fmtFecha(empresa.inicio_actividades)}</div>` : ''}
        ${empresa?.telefono ? `<div>Tel: ${empresa.telefono}</div>` : ''}
        ${empresa?.email ? `<div>${empresa.email}</div>` : ''}
      </div>
    </div>
    <div class="header-center">
      <div class="letra-box">${letra}</div>
      <div style="font-size:8px; text-align:center; color:#555; line-height:1.4">COD. ${cod}</div>
    </div>
    <div class="header-right">
      <div class="comp-title">${TIPOS_LABEL[comprobante.tipo] || 'COMPROBANTE'}</div>
      <div class="info">
        <div><strong>N°:</strong> ${numero}</div>
        <div><strong>Fecha emisión:</strong> ${fmtFecha(comprobante.fecha)}</div>
        <div><strong>Punto de venta:</strong> ${String(comprobante.punto_venta || 1).padStart(4, '0')}</div>
      </div>
    </div>
  </div>

  <!-- CONDICIÓN DE VENTA -->
  <div class="cond-venta">
    <strong>Condición de venta:</strong> ${comprobante.condicion_pago || 'Contado'}
  </div>

  <!-- DATOS DEL CLIENTE -->
  <div class="cliente-section">
    <div class="cliente-grid">
      <div><strong>Cliente:</strong> ${comprobante.clientes?.nombre || 'Consumidor Final'}</div>
      ${comprobante.clientes?.cuit_dni ? `<div><strong>CUIT/DNI:</strong> ${comprobante.clientes.cuit_dni}</div>` : '<div></div>'}
      ${comprobante.clientes?.condicion_iva ? `<div><strong>Condición IVA:</strong> ${comprobante.clientes.condicion_iva}</div>` : '<div></div>'}
      ${comprobante.clientes?.domicilio ? `<div><strong>Domicilio:</strong> ${comprobante.clientes.domicilio}</div>` : '<div></div>'}
    </div>
  </div>

  <!-- TABLA DE ITEMS -->
  <table>
    <thead>${sinIva ? theadSinIva : theadConIva}</thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <!-- TOTALES -->
  <div class="totales">
    <div class="totales-inner">${totalesHTML}</div>
  </div>

  <!-- CAE -->
  <div class="cae">
    ${caeHTML}
    ${comprobante.observaciones ? `<div style="margin-top:6px"><strong>Observaciones:</strong> ${comprobante.observaciones}</div>` : ''}
  </div>

  <div class="pie">Comprobante generado por StockFact AR — ${new Date().toLocaleString('es-AR')}</div>
</div>
</body>
</html>`

  const ventana = window.open('', '_blank', 'width=800,height=950')
  ventana.document.write(html)
  ventana.document.close()
}

export default function ComprobantePDF() { return null }
