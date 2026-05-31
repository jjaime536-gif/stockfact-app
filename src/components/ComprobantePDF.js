import React from 'react'

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0)
const fmtFecha = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '-'

const TIPOS_LABEL = {
  FA: 'FACTURA A', FB: 'FACTURA B', FC: 'FACTURA C',
  NCA: 'NOTA DE CRÉDITO A', NCB: 'NOTA DE CRÉDITO B', NCC: 'NOTA DE CRÉDITO C',
  ticket: 'TICKET'
}
const LETRA = { FA: 'A', FB: 'B', FC: 'C', NCA: 'A', NCB: 'B', NCC: 'C', ticket: 'T' }
const COD   = { FA: '01', FB: '06', FC: '11', NCA: '03', NCB: '08', NCC: '13', ticket: '83' }

export function imprimirComprobante(comprobante, empresa) {
  const numero  = `${String(comprobante.punto_venta || 1).padStart(4, '0')}-${String(comprobante.numero || 0).padStart(8, '0')}`
  const letra   = LETRA[comprobante.tipo] || 'B'
  const cod     = COD[comprobante.tipo]   || '06'
  const items   = comprobante.items_comprobante || []

  const itemsHTML = items.length > 0
    ? items.map((it, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}; border-bottom:0.5px solid #ddd">
          <td style="padding:8px 12px">${it.descripcion}</td>
          <td style="padding:8px; text-align:center">${it.cantidad}</td>
          <td style="padding:8px; text-align:right">${fmt(it.precio_unitario)}</td>
          <td style="padding:8px; text-align:center">${it.alicuota_iva}%</td>
          <td style="padding:8px 12px; text-align:right">${fmt(it.subtotal)}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="padding:16px; text-align:center; color:#888">Sin items</td></tr>`

  const caeHTML = comprobante.cae
    ? `<div style="display:flex; gap:40px">
         <div><strong>CAE N°:</strong> ${comprobante.cae}</div>
         <div><strong>Vto. CAE:</strong> ${fmtFecha(comprobante.cae_vencimiento)}</div>
       </div>`
    : `<div style="color:#999; font-style:italic">Comprobante emitido en modo local — CAE pendiente de conexión con ARCA/AFIP</div>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${TIPOS_LABEL[comprobante.tipo] || 'Comprobante'} ${numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; }
    .wrapper { width: 680px; margin: 20px auto; border: 1px solid #ccc; }
    .btn-bar { background: #1a1a1a; padding: 10px 16px; display: flex; gap: 8px; justify-content: flex-end; }
    .btn { border: none; border-radius: 6px; padding: 7px 16px; cursor: pointer; font-size: 13px; font-weight: 500; }
    .btn-print { background: #185FA5; color: #fff; }
    .btn-close { background: #444; color: #fff; }
    .header { display: flex; border-bottom: 2px solid #111; }
    .header-left { flex: 1; padding: 16px 20px; border-right: 2px solid #111; }
    .header-center { width: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid #111; padding: 8px 0; }
    .letra-box { width: 56px; height: 56px; border: 2px solid #111; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .header-right { flex: 1; padding: 16px 20px; }
    .razon { font-weight: 700; font-size: 16px; margin-bottom: 4px; }
    .comp-title { font-weight: 700; font-size: 14px; margin-bottom: 8px; }
    .info { font-size: 11px; color: #444; line-height: 1.7; }
    .cliente { padding: 12px 20px; border-bottom: 1px solid #ccc; background: #fafafa; font-size: 11px; }
    .cliente-row { display: flex; gap: 40px; flex-wrap: wrap; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #111; color: #fff; }
    th { padding: 8px 12px; text-align: left; }
    th.r { text-align: right; }
    th.c { text-align: center; }
    .totales { display: flex; justify-content: flex-end; border-top: 1px solid #ccc; }
    .totales-inner { width: 260px; padding: 12px 20px; }
    .tot-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
    .tot-final { display: flex; justify-content: space-between; padding: 8px 0 4px; margin-top: 6px; border-top: 2px solid #111; font-weight: 700; font-size: 14px; }
    .cae { background: #f5f5f5; border-top: 1px solid #ccc; padding: 12px 20px; font-size: 10px; color: #555; }
    .pie { border-top: 1px solid #ccc; padding: 8px 20px; text-align: center; font-size: 9px; color: #888; }
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
      <button class="btn btn-close" onclick="window.close()">✕ Cerrar</button>
    </div>
    <div class="header">
      <div class="header-left">
        <div class="razon">${empresa?.razon_social || 'Mi Empresa'}</div>
        <div class="info">
          <div>${empresa?.domicilio || ''}</div>
          <div>Condición IVA: ${empresa?.condicion_iva || 'Responsable Inscripto'}</div>
          <div>CUIT: ${empresa?.cuit || '—'}</div>
          ${empresa?.telefono ? `<div>Tel: ${empresa.telefono}</div>` : ''}
          ${empresa?.email ? `<div>${empresa.email}</div>` : ''}
        </div>
      </div>
      <div class="header-center">
        <div class="letra-box">${letra}</div>
        <div style="font-size:9px; text-align:center; color:#555; line-height:1.3">COD. ${cod}</div>
      </div>
      <div class="header-right">
        <div class="comp-title">${TIPOS_LABEL[comprobante.tipo] || 'COMPROBANTE'}</div>
        <div class="info">
          <div><strong>N°:</strong> ${numero}</div>
          <div><strong>Fecha:</strong> ${fmtFecha(comprobante.fecha)}</div>
          <div><strong>Punto de venta:</strong> ${String(comprobante.punto_venta || 1).padStart(4, '0')}</div>
          <div><strong>Condición pago:</strong> ${comprobante.condicion_pago || 'Contado'}</div>
        </div>
      </div>
    </div>

    <div class="cliente">
      <div class="cliente-row">
        <div><span style="color:#666">Cliente: </span><strong>${comprobante.clientes?.nombre || 'Consumidor Final'}</strong></div>
        ${comprobante.clientes?.cuit_dni ? `<div><span style="color:#666">CUIT/DNI: </span><strong>${comprobante.clientes.cuit_dni}</strong></div>` : ''}
        ${comprobante.clientes?.condicion_iva ? `<div><span style="color:#666">Cond. IVA: </span><strong>${comprobante.clientes.condicion_iva}</strong></div>` : ''}
        ${comprobante.clientes?.domicilio ? `<div><span style="color:#666">Domicilio: </span><strong>${comprobante.clientes.domicilio}</strong></div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40%">Descripción</th>
          <th class="c" style="width:10%">Cant.</th>
          <th class="r" style="width:17%">P. Unitario</th>
          <th class="c" style="width:10%">IVA %</th>
          <th class="r" style="width:18%">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>

    <div class="totales">
      <div class="totales-inner">
        <div class="tot-row"><span style="color:#555">Subtotal neto:</span><span>${fmt(comprobante.subtotal)}</span></div>
        <div class="tot-row"><span style="color:#555">IVA:</span><span>${fmt(comprobante.iva_total)}</span></div>
        ${comprobante.otros_tributos > 0 ? `<div class="tot-row"><span style="color:#555">Otros tributos:</span><span>${fmt(comprobante.otros_tributos)}</span></div>` : ''}
        <div class="tot-final"><span>TOTAL:</span><span>${fmt(comprobante.total)}</span></div>
      </div>
    </div>

    <div class="cae">${caeHTML}
      ${comprobante.observaciones ? `<div style="margin-top:6px"><strong>Obs:</strong> ${comprobante.observaciones}</div>` : ''}
    </div>

    <div class="pie">Comprobante generado por StockFact AR — ${new Date().toLocaleString('es-AR')}</div>
  </div>
</body>
</html>`

  const ventana = window.open('', '_blank', 'width=760,height=900')
  ventana.document.write(html)
  ventana.document.close()
}

// Componente wrapper (no hace nada, la función de arriba es la que se usa)
export default function ComprobantePDF() { return null }
