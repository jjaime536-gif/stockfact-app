import React from 'react'

const fmt = (n) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
const fmtFecha = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '-'

const TIPOS_LABEL = {
  FA:'FACTURA', FB:'FACTURA', FC:'FACTURA',
  NCA:'NOTA DE CRÉDITO', NCB:'NOTA DE CRÉDITO', NCC:'NOTA DE CRÉDITO',
  NDA:'NOTA DE DÉBITO',  NDB:'NOTA DE DÉBITO',  NDC:'NOTA DE DÉBITO',
  ticket:'TICKET'
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

  // Fecha separada en día/mes/año
  const fechaObj = comprobante.fecha ? new Date(comprobante.fecha + 'T00:00:00') : new Date()
  const dia  = String(fechaObj.getDate()).padStart(2,'0')
  const mes  = String(fechaObj.getMonth()+1).padStart(2,'0')
  const anio = fechaObj.getFullYear()

  // Extraer referencia comprobante original
  let compOriginalRef = ''
  let obsLimpia = comprobante.observaciones || ''
  if (esNota && obsLimpia.includes('Asociado a comprobante:')) {
    const partes = obsLimpia.split('|')
    compOriginalRef = partes[0].replace('Asociado a comprobante:','').trim()
    obsLimpia = partes.slice(1).join('|').trim()
  }

  // Condición IVA cliente — checkboxes
  const condIvaCliente = (comprobante.clientes?.condicion_iva || '').toLowerCase()
  const chk = (cond) => condIvaCliente.includes(cond) ? '&#9745;' : '&#9744;'
  const esCF = !comprobante.clientes || !comprobante.clientes.nombre

  // Condición IVA emisor para el talonario
  const condIvaEmisor = (empresa?.condicion_iva || '').toLowerCase()
  const condEmisorLabel = condIvaEmisor.includes('monotribut')
    ? 'RESPONSABLE MONOTRIBUTO'
    : condIvaEmisor.includes('exento') ? 'EXENTO'
    : 'RESPONSABLE INSCRIPTO'

  // Items: mínimo 8 filas para que se vea como talonario
  const MIN_ROWS = 8
  const itemRows = [...items]
  while (itemRows.length < MIN_ROWS) itemRows.push(null)

  const itemsHTML = itemRows.map((it, i) => {
    if (!it) return `<tr>
      <td style="border-bottom:.5px dotted #bbb;height:22px">&nbsp;</td>
      <td style="border-bottom:.5px dotted #bbb">&nbsp;</td>
      <td style="border-bottom:.5px dotted #bbb">&nbsp;</td>
      ${sinIva ? '' : '<td style="border-bottom:.5px dotted #bbb">&nbsp;</td>'}
      <td style="border-bottom:.5px dotted #bbb;text-align:right">&nbsp;</td>
    </tr>`
    const cant = parseFloat(it.cantidad) || 0
    const pu   = parseFloat(it.precio_unitario) || 0
    const sub  = cant * pu
    return `<tr>
      <td style="border-bottom:.5px dotted #bbb;height:22px;text-align:center">${fmt(cant)}</td>
      <td style="border-bottom:.5px dotted #bbb;padding-left:6px">${it.descripcion}</td>
      ${sinIva ? '' : `<td style="border-bottom:.5px dotted #bbb;text-align:center">${it.alicuota_iva}%</td>`}
      <td style="border-bottom:.5px dotted #bbb;text-align:right">${fmt(pu)}</td>
      <td style="border-bottom:.5px dotted #bbb;text-align:right">${fmt(sub)}</td>
    </tr>`
  }).join('')

  // Totales
  const totalesHTML = sinIva
    ? `<tr><td>Subtotal</td><td class="r">$ ${fmt(comprobante.total)}</td></tr>
       <tr><td>Otros Tributos</td><td class="r">$ ${fmt(comprobante.otros_tributos||0)}</td></tr>`
    : `<tr><td>Subtotal Neto</td><td class="r">$ ${fmt(comprobante.subtotal)}</td></tr>
       <tr><td>IVA</td><td class="r">$ ${fmt(comprobante.iva_total)}</td></tr>
       ${comprobante.otros_tributos>0?`<tr><td>Otros Tributos</td><td class="r">$ ${fmt(comprobante.otros_tributos)}</td></tr>`:''}`

  const caeHTML = comprobante.cae
    ? `CAE N°: <strong>${comprobante.cae}</strong> &nbsp;&nbsp; Vto. CAE: <strong>${fmtFecha(comprobante.cae_vencimiento)}</strong>`
    : `CAE pendiente &mdash; conectar ARCA/AFIP para emisión electrónica oficial`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${TIPOS_LABEL[comprobante.tipo]||'Comprobante'} ${letra} ${numero}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#e8e8e8}
  .page{width:680px;margin:16px auto;background:#fff;border:1.5px solid #555;padding:0}
  .actions{background:#222;padding:9px 14px;display:flex;gap:8px;justify-content:flex-end}
  .btn{border:none;border-radius:5px;padding:6px 16px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit}
  .btn-p{background:#185FA5;color:#fff}
  .btn-c{background:#555;color:#fff}

  /* ── ENCABEZADO ── */
  .enc{display:grid;grid-template-columns:1fr 120px 1fr;border-bottom:1.5px solid #555;min-height:110px}
  .enc-left{padding:10px 14px;border-right:1.5px solid #555}
  .enc-center{display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1.5px solid #555;gap:4px}
  .enc-right{padding:10px 14px}
  .letra-box{width:64px;height:64px;border:2px solid #333;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;line-height:1}
  .tipo-label{font-size:13px;font-weight:700;letter-spacing:.04em;text-align:right}
  .razon{font-size:13px;font-weight:700;margin-bottom:4px}
  .sub{font-size:9.5px;color:#444;line-height:1.65}
  .num-label{font-size:9px;color:#555;margin-top:6px;text-align:right}
  .num-val{font-size:12px;font-weight:700;text-align:right}
  .fecha-row{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:8px;font-size:9.5px}
  .fecha-box{border:1px solid #555;width:30px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11px}
  .cond-emisor{text-align:center;font-size:9px;font-weight:700;letter-spacing:.05em;color:#333;border-top:1px solid #555;padding:4px 0;margin-top:4px;width:100%}

  /* ── SECCIÓN CLIENTE ── */
  .cliente-sec{border-bottom:1px solid #555}
  .cliente-row{padding:5px 14px;display:flex;align-items:baseline;gap:6px;border-bottom:.5px solid #ccc;font-size:10px}
  .cliente-row label{font-weight:700;min-width:60px;flex-shrink:0}
  .linea{flex:1;border-bottom:1px dotted #888;min-height:14px}
  .iva-row{display:flex;gap:0;border-bottom:1px solid #555}
  .iva-cell{padding:5px 14px;font-size:9.5px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-right:1px solid #555;flex:1}
  .iva-cell:last-child{border-right:none}
  .iva-opt{display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
  .cond-venta{display:flex;align-items:center;gap:10px;padding:5px 14px;border-bottom:1px solid #555;font-size:9.5px;font-weight:700}

  ${esNota ? `.nota-ref{padding:5px 14px;background:#FFF8E6;border-bottom:1px solid #e0c060;font-size:9.5px;color:#7a5800}` : ''}

  /* ── TABLA ITEMS ── */
  table.items{width:100%;border-collapse:collapse;font-size:10px}
  table.items th{background:#eee;border:1px solid #aaa;padding:5px 8px;font-weight:700;font-size:9.5px}
  table.items td{padding:2px 8px;font-size:10px}
  table.items th.c,table.items td.c{text-align:center}
  table.items th.r,table.items td.r{text-align:right}

  /* ── PIE ── */
  .pie-wrap{border-top:1.5px solid #555;display:grid;grid-template-columns:1fr 220px}
  .pie-obs{padding:10px 14px;font-size:9.5px;color:#555;border-right:1px solid #555}
  .pie-obs b{display:block;color:#111;margin-bottom:3px;font-size:10px}
  .totales-wrap{padding:0}
  table.tots{width:100%;border-collapse:collapse;font-size:10px}
  table.tots td{padding:5px 14px;border-bottom:.5px solid #eee}
  table.tots td.r{text-align:right}
  .tot-final-row td{border-top:2px solid #333;border-bottom:none;font-weight:700;font-size:14px;padding:8px 14px;background:#f5f5f5}
  .tot-final-row td.r{text-align:right}

  /* ── CAE ── */
  .cae{padding:7px 14px;border-top:1px solid #aaa;background:#f9f9f9;font-size:9px;color:#666;text-align:center}
  .firma{padding:7px 14px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;color:#aaa}

  @media print{
    @page{margin:6mm;size:A4}
    body{background:#fff}
    .actions{display:none!important}
    .page{width:100%;margin:0;border:none}
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
  <div class="enc">
    <div class="enc-left">
      <div class="razon">${empresa?.razon_social||'Mi Empresa'}</div>
      <div class="sub">
        ${empresa?.domicilio?`<div>${empresa.domicilio}</div>`:''}
        ${empresa?.telefono?`<div>Tel.: ${empresa.telefono}</div>`:''}
        ${empresa?.email?`<div>${empresa.email}</div>`:''}
        ${empresa?.inicio_actividades?`<div>Inicio de Actividades: ${fmtFecha(empresa.inicio_actividades)}</div>`:''}
      </div>
    </div>

    <div class="enc-center">
      <div class="tipo-label" style="position:absolute;right:14px;top:14px">${TIPOS_LABEL[comprobante.tipo]||'COMPROBANTE'}</div>
      <div class="letra-box">${letra}</div>
      <div style="font-size:9px;color:#666">Cód. ${cod}</div>
      <div class="cond-emisor">${condEmisorLabel}</div>
    </div>

    <div class="enc-right" style="position:relative">
      <div class="tipo-label">${TIPOS_LABEL[comprobante.tipo]||'COMPROBANTE'}</div>
      <div class="num-label">N°</div>
      <div class="num-val">${numero}</div>
      <div class="fecha-row">
        <span>FECHA</span>
        <div class="fecha-box">${dia}</div>
        <div class="fecha-box">${mes}</div>
        <div class="fecha-box">${anio}</div>
      </div>
      <div class="sub" style="margin-top:6px">
        C.U.I.T. N°: <strong>${empresa?.cuit||'—'}</strong>
      </div>
    </div>
  </div>

  <!-- CLIENTE -->
  <div class="cliente-sec">
    <div class="cliente-row">
      <label>Señores:</label>
      <span style="flex:1;border-bottom:1px dotted #888;padding-bottom:1px;min-height:14px">
        ${comprobante.clientes?.nombre||'Consumidor Final'}
      </span>
      ${comprobante.clientes?.cuit_dni?`<label style="margin-left:16px">C.U.I.T.:</label>
      <span style="border-bottom:1px dotted #888;padding:0 8px;min-width:120px">${comprobante.clientes.cuit_dni}</span>`:''}
    </div>
    <div class="cliente-row">
      <label>Dirección:</label>
      <span style="flex:1;border-bottom:1px dotted #888;padding-bottom:1px;min-height:14px">
        ${comprobante.clientes?.domicilio||''}
      </span>
    </div>

    <!-- IVA del cliente -->
    <div class="iva-row">
      <div class="iva-cell">
        <strong>IVA</strong>
        <span class="iva-opt">${chk('responsable inscript')} Resp. Inscripto</span>
        <span class="iva-opt">${chk('monotribut')} Resp. Monotributo</span>
        <span class="iva-opt">${chk('exento')} Exento</span>
        <span class="iva-opt">${chk('no responsable')} No Responsable</span>
        <span class="iva-opt">${esCF||chk('consumidor final')==='&#9745;'?'&#9745;':'&#9744;'} Cons. Final</span>
      </div>
    </div>

    <!-- Condición de venta -->
    <div class="cond-venta">
      Condiciones de Venta: ${comprobante.condicion_pago||'Contado'}
    </div>

    ${esNota&&compOriginalRef?`<div class="nota-ref">&#9888; Comprobante que se corrige: <strong>${compOriginalRef}</strong></div>`:''}
  </div>

  <!-- TABLA DE ITEMS -->
  <table class="items">
    <thead>
      <tr>
        <th class="c" style="width:10%">CANT.</th>
        <th style="width:${sinIva?'58%':'50%'}">DETALLE</th>
        ${sinIva?'':`<th class="c" style="width:10%">IVA %</th>`}
        <th class="r" style="width:${sinIva?'17%':'15%'}">P.UNITARIO</th>
        <th class="r" style="width:${sinIva?'15%':'15%'}">IMPORTE</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <!-- PIE -->
  <div class="pie-wrap">
    <div class="pie-obs">
      ${obsLimpia?`<b>Observaciones:</b>${obsLimpia}`:'&nbsp;'}
    </div>
    <div class="totales-wrap">
      <table class="tots">
        ${totalesHTML}
        <tr class="tot-final-row">
          <td>TOTAL $</td>
          <td class="r">$ ${fmt(comprobante.total)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- CAE -->
  <div class="cae">${caeHTML}</div>

  <div class="firma">
    <span>ORIGINAL BLANCO &mdash; DUPLICADO COLOR</span>
    <span>Comprobante generado por StockFact AR &mdash; ${new Date().toLocaleDateString('es-AR')}</span>
  </div>
</div>
</body>
</html>`

  const w = window.open('','_blank','width=780,height:980')
  w.document.write(html)
  w.document.close()
}

export default function ComprobantePDF() { return null }
