import React from 'react'

// Componente de comprobante imprimible
// Se renderiza en pantalla y se imprime con window.print()

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0)
const fmtFecha = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '-'

const TIPOS_LABEL = {
  FA: 'FACTURA A', FB: 'FACTURA B', FC: 'FACTURA C',
  NCA: 'NOTA DE CRÉDITO A', NCB: 'NOTA DE CRÉDITO B', NCC: 'NOTA DE CRÉDITO C',
  ticket: 'TICKET'
}

const LETRA = { FA: 'A', FB: 'B', FC: 'C', NCA: 'A', NCB: 'B', NCC: 'C', ticket: 'T' }

export default function ComprobantePDF({ comprobante, empresa, onClose }) {
  if (!comprobante) return null

  const numero = `${String(comprobante.punto_venta || 1).padStart(4, '0')}-${String(comprobante.numero || 0).padStart(8, '0')}`
  const letra = LETRA[comprobante.tipo] || 'B'
  const items = comprobante.items_comprobante || []

  const handleImprimir = () => window.print()

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #comprobante-print { display: block !important; }
          #comprobante-print .no-print { display: none !important; }
        }
        @media screen {
          #comprobante-print {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            overflow-y: auto; padding: 20px;
          }
        }
      `}</style>

      <div id="comprobante-print">
        {/* Contenedor del comprobante */}
        <div style={{
          background: '#fff', color: '#111', fontFamily: 'Arial, sans-serif',
          fontSize: 12, width: 680, maxWidth: '100%',
          border: '1px solid #ccc', padding: 0,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
        }}>

          {/* Botones de acción (no se imprimen) */}
          <div className="no-print" style={{
            background: '#1a1a1a', padding: '10px 16px',
            display: 'flex', gap: 8, justifyContent: 'flex-end'
          }}>
            <button onClick={handleImprimir} style={{
              background: '#185FA5', color: '#fff', border: 'none',
              borderRadius: 6, padding: '7px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 500
            }}>🖨 Imprimir / Guardar PDF</button>
            <button onClick={onClose} style={{
              background: '#444', color: '#fff', border: 'none',
              borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13
            }}>✕ Cerrar</button>
          </div>

          {/* ENCABEZADO */}
          <div style={{ display: 'flex', borderBottom: '2px solid #111' }}>
            {/* Datos emisor - izquierda */}
            <div style={{ flex: 1, padding: '16px 20px', borderRight: '2px solid #111' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {empresa?.razon_social || 'Mi Empresa'}
              </div>
              <div style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>
                <div>{empresa?.domicilio || 'Domicilio fiscal'}</div>
                <div>Condición IVA: {empresa?.condicion_iva || 'Responsable Inscripto'}</div>
                <div>CUIT: {empresa?.cuit || '—'}</div>
                {empresa?.telefono && <div>Tel: {empresa.telefono}</div>}
                {empresa?.email && <div>{empresa.email}</div>}
              </div>
            </div>

            {/* Letra central */}
            <div style={{
              width: 80, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              borderRight: '2px solid #111', padding: '8px 0'
            }}>
              <div style={{
                width: 56, height: 56, border: '2px solid #111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, marginBottom: 4
              }}>{letra}</div>
              <div style={{ fontSize: 9, textAlign: 'center', color: '#555', lineHeight: 1.3 }}>
                COD. {comprobante.tipo === 'FC' ? '11' : comprobante.tipo === 'FA' ? '01' : '06'}
              </div>
            </div>

            {/* Datos comprobante - derecha */}
            <div style={{ flex: 1, padding: '16px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                {TIPOS_LABEL[comprobante.tipo] || 'FACTURA'}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.9 }}>
                <div><strong>N°:</strong> {numero}</div>
                <div><strong>Fecha:</strong> {fmtFecha(comprobante.fecha)}</div>
                <div><strong>Punto de venta:</strong> {String(comprobante.punto_venta || 1).padStart(4, '0')}</div>
                <div><strong>Condición pago:</strong> {comprobante.condicion_pago || 'Contado'}</div>
              </div>
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #ccc', background: '#fafafa' }}>
            <div style={{ display: 'flex', gap: 40, fontSize: 11, flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#666' }}>Cliente: </span>
                <strong>{comprobante.clientes?.nombre || 'Consumidor Final'}</strong>
              </div>
              {comprobante.clientes?.cuit_dni && (
                <div>
                  <span style={{ color: '#666' }}>CUIT/DNI: </span>
                  <strong>{comprobante.clientes.cuit_dni}</strong>
                </div>
              )}
              {comprobante.clientes?.condicion_iva && (
                <div>
                  <span style={{ color: '#666' }}>Condición IVA: </span>
                  <strong>{comprobante.clientes.condicion_iva}</strong>
                </div>
              )}
              {comprobante.clientes?.domicilio && (
                <div>
                  <span style={{ color: '#666' }}>Domicilio: </span>
                  <strong>{comprobante.clientes.domicilio}</strong>
                </div>
              )}
            </div>
          </div>

          {/* TABLA DE ITEMS */}
          <div style={{ padding: '0 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#111', color: '#fff' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '40%' }}>Descripción</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '10%' }}>Cant.</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', width: '15%' }}>P. Unitario</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '10%' }}>IVA %</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '15%' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid #ddd', background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ padding: '8px 12px' }}>{item.descripcion}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>{item.cantidad}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right' }}>{fmt(item.precio_unitario)}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>{item.alicuota_iva}%</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(item.subtotal)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#888' }}>Sin items</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALES */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #ccc' }}>
            <div style={{ width: 260, padding: '12px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                <span style={{ color: '#555' }}>Subtotal neto:</span>
                <span>{fmt(comprobante.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                <span style={{ color: '#555' }}>IVA:</span>
                <span>{fmt(comprobante.iva_total)}</span>
              </div>
              {comprobante.otros_tributos > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11 }}>
                  <span style={{ color: '#555' }}>Otros tributos:</span>
                  <span>{fmt(comprobante.otros_tributos)}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0 4px', marginTop: 6,
                borderTop: '2px solid #111', fontWeight: 700, fontSize: 14
              }}>
                <span>TOTAL:</span>
                <span>{fmt(comprobante.total)}</span>
              </div>
            </div>
          </div>

          {/* CAE */}
          <div style={{
            background: '#f5f5f5', borderTop: '1px solid #ccc',
            padding: '12px 20px', fontSize: 10, color: '#555'
          }}>
            {comprobante.cae ? (
              <div style={{ display: 'flex', gap: 40 }}>
                <div><strong>CAE N°:</strong> {comprobante.cae}</div>
                <div><strong>Vto. CAE:</strong> {fmtFecha(comprobante.cae_vencimiento)}</div>
              </div>
            ) : (
              <div style={{ color: '#999', fontStyle: 'italic' }}>
                Comprobante emitido en modo local — CAE pendiente de conexión con ARCA/AFIP
              </div>
            )}
            {comprobante.observaciones && (
              <div style={{ marginTop: 6 }}>
                <strong>Observaciones:</strong> {comprobante.observaciones}
              </div>
            )}
          </div>

          {/* PIE */}
          <div style={{
            borderTop: '1px solid #ccc', padding: '8px 20px',
            textAlign: 'center', fontSize: 9, color: '#888'
          }}>
            Comprobante generado por StockFact AR — {new Date().toLocaleString('es-AR')}
          </div>
        </div>
      </div>
    </>
  )
}
