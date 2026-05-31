import React, { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Completá email y contraseña'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    onLogin(data.user)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg2)'
    }}>
      <div style={{
        background: 'var(--bg)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '36px 40px', width: 380,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            StockFact AR
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            Ingresá con tu cuenta
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" autoFocus
              style={{
                width: '100%', padding: '9px 12px',
                border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
                background: 'var(--bg)', color: 'var(--text)',
                fontSize: 14, fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '9px 12px',
                border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)',
                background: 'var(--bg)', color: 'var(--text)',
                fontSize: 14, fontFamily: 'inherit'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-light)', color: 'var(--red)',
              borderRadius: 'var(--radius)', padding: '9px 12px',
              fontSize: 13, marginBottom: 14
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px',
            background: loading ? 'var(--border2)' : 'var(--blue)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius)',
            fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s'
          }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          ¿Olvidaste tu contraseña? Contactá al administrador
        </div>
      </div>
    </div>
  )
}
