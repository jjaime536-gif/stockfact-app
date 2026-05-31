import React, { useMemo } from 'react'
import { Card, CardTitle, Metric, Grid, Table, Badge, formatPeso, formatFecha } from '../components/UI'

const badgeEstado = (e) => {
  const m = { cobrada: 'success', pendiente: 'warning', vencida: 'danger', anulada: 'gray' }
  return <Badge type={m[e] || 'gray'}>{e}</Badge>
}

export default function Dashboard({ productos, comprobantes }) {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]

  const stats = useMemo(() => {
    const delMes = comprobantes.filter(c =>
      c.fecha >= inicioMes && c.fecha <= finMes && ['FA','FB','FC','ticket'].includes(c.tipo)
    )
    const totalMes = delMes.reduce((s, c) => s + (c.total || 0), 0)
    const pendientes = comprobantes.filter(c => c.estado === 'pendiente')
    const totalPend  = pendientes.reduce((s, c) => s + (c.total || 0), 0)
    const stockBajo  = productos.filter(p => p.stock_actual <= p.stock_minimo && p.categoria !== 'Servicios')
    return { totalMes, cantMes: delMes.length, totalPend, cantPend: pendientes.length, stockBajo }
  }, [comprobantes, productos, inicioMes, finMes])

  const ultimas = comprobantes.slice(0, 8)
  const stockBajo = stats.stockBajo.slice(0, 6)

  return (
    <div>
      <Grid cols={4} gap={12} style={{ marginBottom: 16 }}>
        <Metric label="Facturado este mes" value={formatPeso(stats.totalMes)} sub={`${stats.cantMes} comprobantes`} />
        <Metric label="Pendiente de cobro" value={formatPeso(stats.totalPend)} sub={`${stats.cantPend} facturas`} subColor="var(--amber)" />
        <Metric label="Productos en stock" value={productos.length} sub={`${stats.stockBajo.length} con stock bajo`} subColor={stats.stockBajo.length ? 'var(--red)' : undefined} />
        <Metric label="Clientes activos" value="—" sub="cargá tus clientes" />
      </Grid>

      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>Últimas facturas</CardTitle>
          <Table
            headers={['N°', 'Cliente', 'Total', 'Estado']}
            emptyMsg="Aún no hay comprobantes"
            rows={ultimas.map(c => ({
              cells: [
                `${String(c.punto_venta).padStart(4,'0')}-${String(c.numero||0).padStart(8,'0')}`,
                c.clientes?.nombre || 'Consumidor Final',
                formatPeso(c.total),
                badgeEstado(c.estado)
              ]
            }))}
          />
        </Card>

        <Card>
          <CardTitle>⚠ Stock bajo</CardTitle>
          {stockBajo.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Todo el stock en nivel normal ✓</p>
            : <Table
                headers={['Producto', 'Stock', 'Mínimo']}
                rows={stockBajo.map(p => ({
                  cells: [
                    p.nombre,
                    <span style={{ color: 'var(--red)', fontWeight: 500 }}>{p.stock_actual} {p.unidad}</span>,
                    p.stock_minimo
                  ]
                }))}
              />
          }
        </Card>
      </Grid>
    </div>
  )
}
