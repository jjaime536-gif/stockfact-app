import React, { useState, useMemo } from 'react'
import { Card, CardTitle, Metric, Grid, Table, Badge, Btn, formatPeso, formatFecha } from '../components/UI'

export default function Reportes({ comprobantes }) {
  const hoy = new Date()
  const [desde, setDesde] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0])
  const [hasta, setHasta] = useState(hoy.toISOString().split('T')[0])

  const filtrados = useMemo(() =>
    comprobantes.filter(c => c.fecha >= desde && c.fecha <= hasta && ['FA','FB','FC','ticket'].includes(c.tipo)),
    [comprobantes, desde, hasta]
  )

  const stats = useMemo(() => {
    const total = filtrados.reduce((s, c) => s + (c.total || 0), 0)
    const iva   = filtrados.reduce((s, c) => s + (c.iva_total || 0), 0)
    const neto  = filtrados.reduce((s, c) => s + (c.subtotal || 0), 0)
    const prom  = filtrados.length ? total / filtrados.length : 0
    const cobradas  = filtrados.filter(c => c.estado === 'cobrada').reduce((s,c) => s+(c.total||0), 0)
    const pendientes= filtrados.filter(c => c.estado === 'pendiente').reduce((s,c) => s+(c.total||0), 0)
    const vencidas  = filtrados.filter(c => c.estado === 'vencida').reduce((s,c) => s+(c.total||0), 0)
    // Agrupar por cliente
    const porCliente = {}
    filtrados.forEach(c => {
      const k = c.clientes?.nombre || 'Consumidor Final'
      if (!porCliente[k]) porCliente[k] = { cant: 0, total: 0 }
      porCliente[k].cant++; porCliente[k].total += (c.total||0)
    })
    const topClientes = Object.entries(porCliente).sort((a,b)=>b[1].total-a[1].total).slice(0,8)
    return { total, iva, neto, prom, cobradas, pendientes, vencidas, topClientes }
  }, [filtrados])

  return (
    <div>
      {/* Filtros */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              style={{ padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              style={{ padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }} />
          </div>
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{filtrados.length} comprobantes</span>
          </div>
          <div style={{ marginLeft: 'auto', marginTop: 16 }}>
            <Btn onClick={() => {
              const csv = ['N°,Tipo,Fecha,Cliente,Neto,IVA,Total,Estado',
                ...filtrados.map(c => [
                  `${String(c.punto_venta||1).padStart(4,'0')}-${String(c.numero||0).padStart(8,'0')}`,
                  c.tipo, c.fecha, c.clientes?.nombre||'CF',
                  c.subtotal, c.iva_total, c.total, c.estado
                ].join(','))
              ].join('\n')
              const a = document.createElement('a')
              a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
              a.download = `reporte_${desde}_${hasta}.csv`
              a.click()
            }}>⤓ Exportar CSV</Btn>
          </div>
        </div>
      </Card>

      <Grid cols={4} gap={12} style={{ marginBottom: 16 }}>
        <Metric label="Total facturado" value={formatPeso(stats.total)} sub={`${filtrados.length} comprobantes`} />
        <Metric label="Neto gravado" value={formatPeso(stats.neto)} />
        <Metric label="IVA total" value={formatPeso(stats.iva)} />
        <Metric label="Ticket promedio" value={formatPeso(stats.prom)} />
      </Grid>

      <Grid cols={2} gap={16} style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle>Estado de cobro</CardTitle>
          <Table
            headers={['Estado','Monto','%']}
            rows={[
              { cells: [<Badge type="success">Cobradas</Badge>, formatPeso(stats.cobradas), stats.total ? `${Math.round(stats.cobradas/stats.total*100)}%` : '—'] },
              { cells: [<Badge type="warning">Pendientes</Badge>, formatPeso(stats.pendientes), stats.total ? `${Math.round(stats.pendientes/stats.total*100)}%` : '—'] },
              { cells: [<Badge type="danger">Vencidas</Badge>, formatPeso(stats.vencidas), stats.total ? `${Math.round(stats.vencidas/stats.total*100)}%` : '—'] },
            ]}
          />
        </Card>

        <Card>
          <CardTitle>Top clientes</CardTitle>
          <Table
            headers={['Cliente','Fact.','Total']}
            emptyMsg="Sin datos en el período"
            rows={stats.topClientes.map(([nombre, d]) => ({
              cells: [nombre, d.cant, formatPeso(d.total)]
            }))}
          />
        </Card>
      </Grid>

      <Card>
        <CardTitle>Libro IVA Ventas</CardTitle>
        <Table
          headers={['N°','Tipo','Fecha','Cliente','Neto','IVA 21%','Total','Estado']}
          emptyMsg="Sin comprobantes en el período seleccionado"
          rows={filtrados.map(c => ({
            cells: [
              `${String(c.punto_venta||1).padStart(4,'0')}-${String(c.numero||0).padStart(8,'0')}`,
              c.tipo, formatFecha(c.fecha),
              c.clientes?.nombre || 'Consumidor Final',
              formatPeso(c.subtotal), formatPeso(c.iva_total), formatPeso(c.total),
              <Badge type={c.estado==='cobrada'?'success':c.estado==='pendiente'?'warning':'danger'}>{c.estado}</Badge>
            ]
          }))}
        />
      </Card>
    </div>
  )
}
