import React from 'react'

export const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '16px', ...style
  }}>{children}</div>
)

export const CardTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 12 }}>{children}</div>
)

export const Metric = ({ label, value, sub, subColor }) => (
  <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 14 }}>
    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: subColor || 'var(--text3)', marginTop: 2 }}>{sub}</div>}
  </div>
)

export const Btn = ({ children, onClick, primary, danger, sm, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: sm ? '5px 10px' : '7px 14px',
    fontSize: sm ? 12 : 13, fontWeight: 500,
    borderRadius: 'var(--radius)',
    border: primary ? 'none' : danger ? 'none' : '0.5px solid var(--border2)',
    background: primary ? 'var(--blue)' : danger ? '#E24B4A' : 'var(--bg)',
    color: primary || danger ? '#fff' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s', ...style
  }}>{children}</button>
)

export const Badge = ({ children, type = 'gray' }) => {
  const colors = {
    success: { bg: 'var(--green-light)', color: 'var(--green)' },
    warning: { bg: 'var(--amber-light)', color: 'var(--amber)' },
    danger:  { bg: 'var(--red-light)',   color: 'var(--red)' },
    info:    { bg: 'var(--blue-light)',  color: 'var(--blue)' },
    gray:    { bg: 'var(--bg3)',         color: 'var(--text2)' },
  }
  const c = colors[type] || colors.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
      borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.color
    }}>{children}</span>
  )
}

export const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>{label}</label>}
    <input style={{
      width: '100%', padding: '8px 10px',
      border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
      background: 'var(--bg)', color: 'var(--text)',
      fontSize: 13, fontFamily: 'inherit'
    }} {...props} />
  </div>
)

export const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>{label}</label>}
    <select style={{
      width: '100%', padding: '8px 10px',
      border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
      background: 'var(--bg)', color: 'var(--text)',
      fontSize: 13, fontFamily: 'inherit'
    }} {...props}>{children}</select>
  </div>
)

export const Table = ({ headers, rows, emptyMsg = 'Sin resultados' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>{headers.map((h, i) => (
          <th key={i} style={{
            textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 500,
            color: 'var(--text2)', borderBottom: '0.5px solid var(--border)',
            textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
          }}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={headers.length} style={{ padding: 30, textAlign: 'center', color: 'var(--text3)' }}>{emptyMsg}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ cursor: row.onClick ? 'pointer' : 'default' }}
                onClick={row.onClick}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
              {row.cells.map((cell, j) => (
                <td key={j} style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border)', color: 'var(--text)' }}>{cell}</td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
)

export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg)', borderRadius: 'var(--radius-lg)',
        border: '0.5px solid var(--border)', width: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 500 }}>{title}</h3>
          <Btn sm onClick={onClose}>✕</Btn>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && <div style={{ padding: '16px 20px', borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  )
}

export const Grid = ({ cols = 2, gap = 16, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>{children}</div>
)

export const formatPeso = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0)

export const formatFecha = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR') : '-'
