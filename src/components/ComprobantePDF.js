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
const COPIAS  = ['ORIGINAL','DUPLICADO','TRIPLICADO']

export function imprimirComprobante(comprobante, empresa) {
  const numero  = `${String(comprobante.punto_venta||1).padStart(4,'0')}-${String(comprobante.numero||0).padStart(8,'0')}`
  const letra   = LETRA[comprobante.tipo] || 'B'
  const cod     = COD[comprobante.tipo]   || '06'
  const items   = comprobante.items_comprobante || []
  const sinIva  = SIN_IVA.includes(comprobante.tipo)
  const esNota  = comprobante.tipo.startsWith('NC') || comprobante.tipo.startsWith('ND')

  // Extraer referencia comprobante original
  let compOriginalRef = ''
  let obsLimpia = comprobante.observaciones || ''
  if (esNota && obsLimpia.includes('Asociado a comprobante:')) {
    const partes = obsLimpia.split('|')
    compOriginalRef = partes[0].replace('Asociado a comprobante:','').trim()
    obsLimpia = partes.slice(1).join('|').trim()
  }

  const condIvaEmisor = (empresa?.condicion_iva || '').toLowerCase()
  const condEmisorLabel = condIvaEmisor.includes('monotribut') ? 'Responsable Monotributo'
    : condIvaEmisor.includes('exento') ? 'Exento'
    : 'Responsable Inscripto'

  const condIvaCliente = (comprobante.clientes?.condicion_iva || 'Consumidor Final')
  const esCF = !comprobante.clientes?.nombre

  // Items: mínimo 10 filas vacías
  const MIN_ROWS = 10
  const itemRows = [...items]
  while (itemRows.length < MIN_ROWS) itemRows.push(null)

  const theadHTML = sinIva
    ? `<tr><th>Código</th><th>Producto / Servicio</th><th>Cantidad</th><th>U. Medida</th><th>Precio Unit.</th><th>% Bonif</th><th>Imp. Bonif.</th><th>Subtotal</th></tr>`
    : `<tr><th>Código</th><th>Producto / Servicio</th><th>Cantidad</th><th>U. Medida</th><th>Precio Unit.</th><th>Alíc. IVA</th><th>Imp. IVA</th><th>Subtotal</th></tr>`

  const itemsHTML = itemRows.map((it, i) => {
    if (!it) return `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    const cant = parseFloat(it.cantidad) || 0
    const pu   = parseFloat(it.precio_unitario) || 0
    const sub  = cant * pu
    const impIva = sinIva ? 0 : sub * (parseFloat(it.alicuota_iva)||0) / 100
    return `<tr>
      <td style="text-align:center">${i+1}</td>
      <td>${it.descripcion}</td>
      <td style="text-align:center">${fmt(cant)}</td>
      <td style="text-align:center">${it.productos?.unidad||'unidades'}</td>
      <td style="text-align:right">${fmt(pu)}</td>
      <td style="text-align:center">${sinIva ? '0,00' : it.alicuota_iva+'%'}</td>
      <td style="text-align:right">${sinIva ? '0,00' : fmt(impIva)}</td>
      <td style="text-align:right">${fmt(sub)}</td>
    </tr>`
  }).join('')

  const totalesHTML = sinIva
    ? `<div class="tot-row"><span>Subtotal: $</span><span>${fmt(comprobante.total)}</span></div>
       <div class="tot-row"><span>Importe Otros Tributos: $</span><span>${fmt(comprobante.otros_tributos||0)}</span></div>
       <div class="tot-row tot-final"><span>Importe Total: $</span><span>${fmt(comprobante.total)}</span></div>`
    : `<div class="tot-row"><span>Subtotal: $</span><span>${fmt(comprobante.subtotal)}</span></div>
       <div class="tot-row"><span>IVA: $</span><span>${fmt(comprobante.iva_total)}</span></div>
       ${comprobante.otros_tributos>0?`<div class="tot-row"><span>Importe Otros Tributos: $</span><span>${fmt(comprobante.otros_tributos)}</span></div>`:''}
       <div class="tot-row tot-final"><span>Importe Total: $</span><span>${fmt(comprobante.total)}</span></div>`

  const caeBlock = comprobante.cae
    ? `<div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>CAE N°:</strong> ${comprobante.cae} &nbsp;&nbsp; <strong>Fecha de Vto. de CAE:</strong> ${fmtFecha(comprobante.cae_vencimiento)}</div>
        <div style="font-weight:700">Comprobante Autorizado</div>
       </div>
       <div style="font-size:9px;color:#666;margin-top:4px">Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación</div>`
    : `<div style="color:#999;font-style:italic">CAE pendiente — conectar ARCA/AFIP para emisión electrónica oficial</div>`

  // Generar una página por copia
  const paginas = COPIAS.map(copia => `
  <div class="pagina">
    <!-- Título copia -->
    <div class="copia-titulo">${copia}</div>

    <!-- ENCABEZADO -->
    <div class="enc">
      <!-- Emisor izquierda -->
      <div class="enc-emisor">
        <div class="emisor-nombre">${empresa?.razon_social||'Mi Empresa'}</div>
        <div class="emisor-dir">${empresa?.domicilio||''}</div>
        ${empresa?.telefono?`<div class="emisor-sub">Tel.: ${empresa.telefono}</div>`:''}
        ${empresa?.email?`<div class="emisor-sub">${empresa.email}</div>`:''}
        <div class="emisor-sub">Condición frente al IVA: <strong>${condEmisorLabel}</strong></div>
      </div>

      <!-- Centro: letra -->
      <div class="enc-letra">
        <div class="letra-box">${letra}<div class="cod-label">COD. ${cod}</div></div>
      </div>

      <!-- Derecha: tipo + datos -->
      <div class="enc-datos">
        <div class="comp-tipo">${TIPOS_LABEL[comprobante.tipo]||'COMPROBANTE'}</div>
        <div class="enc-row"><span>Punto de Venta: <strong>${String(comprobante.punto_venta||1).padStart(5,'0')}</strong></span><span>Comp. Nro: <strong>${String(comprobante.numero||0).padStart(8,'0')}</strong></span></div>
        <div class="enc-row-single">Fecha de Emisión: <strong>${fmtFecha(comprobante.fecha)}</strong></div>
        <div style="height:6px"></div>
        <div class="enc-row-single">CUIT: <strong>${empresa?.cuit||'—'}</strong></div>
        ${empresa?.inicio_actividades?`<div class="enc-row-single">Fecha de Inicio de Actividades: <strong>${fmtFecha(empresa.inicio_actividades)}</strong></div>`:''}
      </div>
    </div>

    <!-- CLIENTE -->
    <div class="cliente-sec">
      <div class="cli-grid-top">
        <div><span class="lbl">CUIT:</span> ${comprobante.clientes?.cuit_dni||'—'}</div>
        <div style="grid-column:span 2"><span class="lbl">Apellido y Nombre / Razón Social:</span> ${comprobante.clientes?.nombre||'Consumidor Final'}</div>
      </div>
      <div class="cli-grid-top" style="border-top:1px solid #ccc">
        <div><span class="lbl">Condición frente al IVA:</span> ${condIvaCliente}</div>
        <div><span class="lbl">Domicilio:</span> ${comprobante.clientes?.domicilio||'—'}</div>
        <div><span class="lbl">Condición de venta:</span> ${comprobante.condicion_pago||'Contado'}</div>
      </div>
      ${esNota&&compOriginalRef?`<div class="nota-ref">Comprobante que se corrige: <strong>${compOriginalRef}</strong></div>`:''}
    </div>

    <!-- TABLA -->
    <table class="items">
      <thead>${theadHTML}</thead>
      <tbody>${itemsHTML}</tbody>
    </table>

    <!-- TOTALES -->
    <div class="totales-wrap">
      <div class="totales-inner">${totalesHTML}</div>
    </div>

    <!-- CAE -->
    <div class="cae">${caeBlock}</div>

    ${obsLimpia?`<div class="obs"><strong>Observaciones:</strong> ${obsLimpia}</div>`:''}
  </div>`).join('<div class="salto"></div>')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${TIPOS_LABEL[comprobante.tipo]} ${letra} ${numero}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10.5px;color:#1a1a1a;background:#e0e0e0}
  .actions{background:#222;padding:9px 14px;display:flex;gap:8px;justify-content:flex-end;position:fixed;top:0;width:100%;z-index:99}
  .btn{border:none;border-radius:5px;padding:6px 16px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit}
  .btn-p{background:#185FA5;color:#fff}
  .btn-c{background:#555;color:#fff}
  .contenido{padding-top:46px}

  .pagina{width:720px;margin:16px auto;background:#fff;border:1px solid #aaa;padding:0}
  .salto{height:20px}

  /* Copia */
  .copia-titulo{text-align:center;font-size:14px;font-weight:700;letter-spacing:.1em;padding:6px 0;border-bottom:1.5px solid #333;background:#f5f5f5}

  /* Encabezado */
  .enc{display:grid;grid-template-columns:1fr 100px 1fr;border-bottom:1.5px solid #333;min-height:100px}
  .enc-emisor{padding:10px 14px;border-right:1.5px solid #333}
  .enc-letra{display:flex;align-items:center;justify-content:center;border-right:1.5px solid #333}
  .enc-datos{padding:10px 14px}
  .emisor-nombre{font-size:13px;font-weight:700;margin-bottom:3px}
  .emisor-dir{font-size:10px;color:#444;margin-bottom:2px}
  .emisor-sub{font-size:10px;color:#444;margin-bottom:1px}
  .letra-box{width:68px;height:68px;border:2px solid #333;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:38px;font-weight:700;line-height:1;position:relative}
  .cod-label{font-size:8px;color:#555;margin-top:2px;font-weight:400}
  .comp-tipo{font-size:16px;font-weight:700;margin-bottom:6px}
  .enc-row{display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px}
  .enc-row-single{font-size:10px;margin-bottom:2px}

  /* Cliente */
  .cliente-sec{border-bottom:1.5px solid #333}
  .cli-grid-top{display:grid;grid-template-columns:1fr 1fr 1fr;padding:6px 14px;gap:4px;font-size:10px}
  .lbl{font-weight:700}
  .nota-ref{padding:5px 14px;background:#FFF8E6;border-top:1px solid #e0c060;font-size:10px;color:#7a5800}

  /* Tabla */
  table.items{width:100%;border-collapse:collapse;font-size:10px}
  table.items thead tr{background:#e8e8e8}
  table.items th{padding:5px 8px;border:1px solid #bbb;font-weight:700;font-size:9.5px;text-align:center}
  table.items td{padding:4px 8px;border-bottom:.5px solid #e0e0e0;font-size:10px;min-height:18px}
  table.items tbody tr:nth-child(even){background:#fafafa}

  /* Totales */
  .totales-wrap{display:flex;justify-content:flex-end;border-top:1.5px solid #333;padding:10px 14px}
  .totales-inner{width:280px}
  .tot-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:.5px solid #eee}
  .tot-final{font-weight:700;font-size:13px;border-top:1.5px solid #333;border-bottom:none;padding-top:6px;margin-top:4px}

  /* CAE */
  .cae{padding:8px 14px;border-top:1px solid #ccc;background:#f9f9f9;font-size:10px}
  .obs{padding:6px 14px;border-top:1px solid #eee;font-size:10px;color:#555}

  @media print{
    @page{margin:6mm;size:A4}
    body{background:#fff}
    .actions{display:none!important}
    .contenido{padding-top:0}
    .pagina{width:100%;margin:0;border:none;page-break-after:always}
    .pagina:last-child{page-break-after:auto}
    .salto{display:none}
  }
</style>
</head>
<body>
<div class="actions">
  <button class="btn btn-p" onclick="window.print()">🖨 Imprimir / Guardar PDF (3 copias)</button>
  <button class="btn btn-c" onclick="window.close()">✕ Cerrar</button>
</div>
<div class="contenido">
  ${paginas}
</div>
</body>
</html>`

  const w = window.open('','_blank','width=800,height=980')
  w.document.write(html)
  w.document.close()
}

export default function ComprobantePDF() { return null }
