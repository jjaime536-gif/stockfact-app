import React from 'react'

const fmt  = (n) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
const fmtFecha = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '-'

const TIPOS_LABEL = {
  FA: 'FACTURA A', FB: 'FACTURA B', FC: 'FACTURA C',
  NCA: 'NOTA DE CRÉDITO A', NCB: 'NOTA DE CRÉDITO B', NCC: 'NOTA DE CRÉDITO C',
  NDA: 'NOTA DE DÉBITO A',  NDB: 'NOTA DE DÉBITO B',  NDC: 'NOTA DE DÉBITO C',
  ticket: 'TICKET'
}
const LETRA = { FA:'A', FB:'B', FC:'C', NCA:'A', NCB:'B', NCC:'C', NDA:'A', NDB:'B', NDC:'C', ticket:'T' }
const COD   = { FA:'01', FB:'06', FC:'11', NCA:'03', NCB:'08', NCC:'13', NDA:'02', NDB:'07', NDC:'12', ticket:'83' }
const SIN_IVA = ['FC','NCC','NDC','ticket']

export function imprimirComprobante(comprobante, empresa) {
  const numero  = `${String(comprobante.punto_venta||1).padStart(4,'0')}-${String(comprobante.numero||0).padStart(8,'0')}`
  const letra   = LETRA[comprobante.tipo] || 'B'
  const cod     = COD[comprobante.tipo]   || '06'
  const items   = comprobante.items_comprobante || []
  const sinIva  = SIN_IVA.includes(comprobante.tipo)
  const esNota  = comprobante.tipo.startsWith('NC') || comprobante.tipo.startsWith('ND')

  // Extraer referencia al comprobante original de observaciones
  let compOriginalRef = ''
  let obsLimpia = comprobante.observaciones || ''
  if (esNota && obsLimpia.includes('Asociado a comprobante:')) {
    const partes = obsLimpia.split('|')
    compOriginalRef = partes[0].replace('Asociado a comprobante:', '').trim()
    obsLimpia = partes.slice(1).join('|').trim()
  }

  // ── Items ──────────────────────────────────────────────────
  const colsSinIva = `
    <col style="width:6%"><col style="width:34%"><col style="width:10%">
    <col style="width:10%"><col style="width:14%"><col style="width:8%"><col style="width:10%"><col style="width:13%">`
  const colsConIva = `
    <col style="width:36%"><col style="width:10%"><col style="width:10%">
    <col style="width:16%"><col style="width:12%"><col style="width:16%">`

  const theadSinIva = `<tr>
    <th>Cód.</th><th>Producto / Servicio</th><th class="c">Cant.</th>
    <th class="c">U. Med.</th><th class="r">P. Unit.</th>
    <th class="c">% Bon.</th><th class="r">Imp. Bon.</th><th class="r">Subtotal</th>
  </tr>`

  const theadConIva = `<tr>
    <th>Descripción</th><th class="c">Cant.</th><th class="c">U. Med.</th>
    <th class="r">P. Unit.</th><th class="c">IVA %</th><th class="r">Subtotal</th>
  </tr>`

  const itemsRows = items.length > 0
    ? items.map((it, i) => {
        const bg = i % 2 === 0 ? '#fff' : '#f7f7f7'
        const cant = parseFloat(it.cantidad) || 0
        const pu   = parseFloat(it.precio_unitario) || 0
        const sub  = cant * pu
        if (sinIva) {
          return `<tr style="background:${bg}">
            <td class="c">${i+1}</td>
            <td>${it.descripcion}</td>
            <td class="c">${fmt(cant)}</td>
            <td class="c">${it.productos?.unidad || 'unidades'}</td>
            <td class="r">${fmt(pu)}</td>
            <td class="c">0,00</td>
            <td class="r">0,00</td>
            <td class="r"><strong>${fmt(sub)}</strong></td>
          </tr>`
        } else {
          return `<tr style="background:${bg}">
            <td>${it.descripcion}</td>
            <td class="c">${fmt(cant)}</td>
            <td class="c">${it.productos?.unidad || 'unidades'}</td>
            <td class="r">${fmt(pu)}</td>
            <td class="c">${it.alicuota_iva}%</td>
            <td class="r"><strong>${fmt(it.subtotal || sub)}</strong></td>
          </tr>`
        }
      }).join('')
    : `<tr><td colspan="${sinIva?8:6}" class="c" style="color:#999;padding:20px">Sin items</td></tr>`

  // ── Totales ────────────────────────────────────────────────
  const totalesRows = sinIva
    ? `<tr><td>Subtotal:</td><td class="r">$ ${fmt(comprobante.total)}</td></tr>
       <tr><td>Importe Otros Tributos:</td><td class="r">$ ${fmt(comprobante.otros_tributos||0)}</td></tr>
       <tr class="tot-final"><td>Importe Total:</td><td class="r">$ ${fmt(comprobante.total)}</td></tr>`
    : `<tr><td>Subtotal neto:</td><td class="r">$ ${fmt(comprobante.subtotal)}</td></tr>
       <tr><td>IVA:</td><td class="r">$ ${fmt(comprobante.iva_total)}</td></tr>
       ${comprobante.otros_tributos>0?`<tr><td>Otros tributos:</td><td class="r">$ ${fmt(comprobante.otros_tributos)}</td></tr>`:''}
       <tr class="tot-final"><td>Importe Total:</td><td class="r">$ ${fmt(comprobante.total)}</td></tr>`

  // ── CAE ────────────────────────────────────────────────────
  const caeHTML = comprobante.cae
    ? `<div style="display:flex;gap:48px"><span><b>CAE N°:</b> ${comprobante.cae}</span><span><b>Vto. CAE:</b> ${fmtFecha(comprobante.cae_vencimiento)}</span></div>`
    : `<span style="color:#aaa;font-style:italic">CAE pendiente — conectar ARCA/AFIP para emisión electrónica oficial</span>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${TIPOS_LABEL[comprobante.tipo]||'Comprobante'} ${numero}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#f0f0f0}
  .page{width:740px;margin:16px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.15)}
  /* Barra de acciones */
  .actions{background:#222;padding:10px 16px;display:flex;gap:8px;justify-content:flex-end}
  .btn{border:none;border-radius:5px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit}
  .btn-p{background:#185FA5;color:#fff}
  .btn-c{background:#555;color:#fff}
  /* Encabezado */
  .header{display:grid;grid-template-columns:1fr 100px 1fr;border-bottom:3px solid #111}
  .h-emisor{padding:16px 20px}
  .h-letra{display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:2px solid #111;border-right:2px solid #111;padding:10px 0}
  .letra-box{width:62px;height:62px;border:2.5px solid #111;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;margin-bottom:3px}
  .h-comp{padding:16px 20px}
  .razon{font-weight:700;font-size:15px;margin-bottom:5px}
  .comp-tipo{font-weight:700;font-size:14px;letter-spacing:.03em;margin-bottom:8px}
  .info{font-size:10px;color:#555;line-height:1.75}
  .info b{color:#111}
  /* Banda de datos */
  .banda{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #ddd;background:#f8f8f8}
  .banda-cell{padding:7px 20px;font-size:10px;border-right:1px solid #ddd}
  .banda-cell:last-child{border-right:none}
  .banda-cell b{color:#111}
  /* Nota original */
  .nota-ref{padding:7px 20px;background:#FFF8E6;border-bottom:1px solid #e8d89a;font-size:10px}
  .nota-ref b{color:#854F0B}
  /* Cliente */
  .cliente{display:grid;grid-template-columns:1fr 1fr;padding:8px 20px;border-bottom:1px solid #ddd;font-size:10px;gap:4px 24px}
  /* Tabla */
  table{width:100%;border-collapse:collapse;font-size:10px}
  thead tr{background:#2c2c2c;color:#fff}
  th{padding:7px 10px;font-weight:600;text-align:left}
  th.c,td.c{text-align:center}
  th.r,td.r{text-align:right}
  td{padding:7px 10px;border-bottom:.5px solid #e8e8e8}
  /* Totales */
  .footer{display:grid;grid-template-columns:1fr 280px;border-top:2px solid #111}
  .footer-obs{padding:14px 20px;font-size:10px;color:#555;border-right:1px solid #ddd}
  .footer-obs b{color:#111;display:block;margin-bottom:4px}
  .totales{padding:0}
  .totales table{font-size:11px}
  .totales td{padding:7px 16px;border-bottom:.5px solid #eee}
  .tot-final td{font-weight:700;font-size:13px;border-top:2px solid #111;border-bottom:none;padding:10px 16px}
  /* CAE */
  .cae{padding:9px 20px;border-top:1px solid #ddd;background:#f8f8f8;font-size:10px;color:#555}
  /* Pie */
  .pie{padding:6px 20px;border-top:1px solid #eee;text-align:center;font-size:9px;color:#aaa}
  @media print{
    @page{margin:8mm;size:A4}
    body{background:#fff}
    .actions{display:none!important}
    .page{width:100%;margin:0;box-shadow:none}
  }
</style>
</head>
<body>
<div class="page">
  <div class="actions">
    <button class="btn btn-p" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
    <button class="btn btn-c" onclick="window.close()">✕ Cerrar</button>
  </div>

  <!-- ENCABEZADO -->
  <div class="header">
    <div class="h-emisor">
      <div class="razon">${empresa?.razon_social||'Mi Empresa'}</div>
      <div class="info">
        ${empresa?.domicilio?`<div>${empresa.domicilio}</div>`:''}
        <div>Condición IVA: <b>${empresa?.condicion_iva||'—'}</b></div>
        <div>CUIT: <b>${empresa?.cuit||'—'}</b></div>
        ${empresa?.inicio_actividades?`<div>Inicio actividades: <b>${fmtFecha(empresa.inicio_actividades)}</b></div>`:''}
        ${empresa?.telefono?`<div>Tel: ${empresa.telefono}</div>`:''}
        ${empresa?.email?`<div>${empresa.email}</div>`:''}
      </div>
    </div>
    <div class="h-letra">
      <div class="letra-box">${letra}</div>
      <div style="font-size:9px;color:#777;text-align:center">COD. ${cod}</div>
    </div>
    <div class="h-comp">
      <div class="comp-tipo">${TIPOS_LABEL[comprobante.tipo]||'COMPROBANTE'}</div>
      <div class="info">
        <div>N°: <b>${numero}</b></div>
        <div>Fecha emisión: <b>${fmtFecha(comprobante.fecha)}</b></div>
        <div>Punto de venta: <b>${String(comprobante.punto_venta||1).padStart(4,'0')}</b></div>
      </div>
    </div>
  </div>

  <!-- BANDA: condición de venta + cliente en una sola fila -->
  <div class="banda">
    <div class="banda-cell"><b>Condición de venta:</b> ${comprobante.condicion_pago||'Contado'}</div>
    <div class="banda-cell"><b>Cliente:</b> ${comprobante.clientes?.nombre||'Consumidor Final'}
      ${comprobante.clientes?.cuit_dni?` &nbsp;|&nbsp; <b>CUIT/DNI:</b> ${comprobante.clientes.cuit_dni}`:''}
    </div>
  </div>

  ${comprobante.clientes?.condicion_iva||comprobante.clientes?.domicilio?`
  <div class="cliente">
    ${comprobante.clientes?.condicion_iva?`<div><b>Cond. IVA:</b> ${comprobante.clientes.condicion_iva}</div>`:'<div></div>'}
    ${comprobante.clientes?.domicilio?`<div><b>Domicilio:</b> ${comprobante.clientes.domicilio}</div>`:'<div></div>'}
  </div>`:''}

  <!-- REFERENCIA COMPROBANTE ORIGINAL (solo en notas) -->
  ${esNota&&compOriginalRef?`<div class="nota-ref"><b>Comprobante que se corrige:</b> ${compOriginalRef}</div>`:''}

  <!-- TABLA DE ITEMS -->
  <table>
    <colgroup>${sinIva?colsSinIva:colsConIva}</colgroup>
    <thead>${sinIva?theadSinIva:theadConIva}</thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <!-- PIE: observaciones + totales -->
  <div class="footer">
    <div class="footer-obs">
      ${obsLimpia?`<b>Observaciones:</b>${obsLimpia}`:'&nbsp;'}
    </div>
    <div class="totales">
      <table>${totalesRows}</table>
    </div>
  </div>

  <!-- CAE -->
  <div class="cae">${caeHTML}</div>

  <div class="pie">Comprobante generado por StockFact AR &mdash; ${new Date().toLocaleString('es-AR')}</div>
</div>
</body>
</html>`

  const w = window.open('','_blank','width=800,height:960')
  w.document.write(html)
  w.document.close()
}

export default function ComprobantePDF() { return null }
