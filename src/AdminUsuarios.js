import React, { useState, useEffect } from 'react'
import { Card, CardTitle, Btn, Table, Modal, Input, Badge } from '../components/UI'
import { supabase } from '../supabase'

export default function AdminUsuarios({ empresa }) {
  const [usuarios, setUsuarios] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nombre: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('usuarios_empresa')
      .select('*, empresa:empresas(razon_social)')
    setUsuarios(data || [])
  }

  useEffect(() => { cargarUsuarios() }, [])

  const crearUsuario = async () => {
    if (!form.email || !form.password) { setError('Email y contraseña son obligatorios'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (!empresa?.id) { setError('Primero configurá los datos de la empresa'); return }
    setGuardando(true); setError('')

    // 1. Crear usuario en Supabase Auth usando el admin client
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: { nombre: form.nombre }
    })

    if (authErr) {
      // Si no tiene permisos admin, usar signUp normal
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nombre: form.nombre } }
      })
      if (signUpErr) { setError(signUpErr.message); setGuardando(false); return }

      // 2. Vincular con la empresa
      const userId = signUpData.user?.id
      if (userId) {
        await supabase.from('usuarios_empresa').insert({
          user_id: userId,
          empresa_id: empresa.id,
          rol: 'admin'
        })
      }
    } else {
      const userId = authData.user?.id
      if (userId) {
        await supabase.from('usuarios_empresa').insert({
          user_id: userId,
          empresa_id: empresa.id,
          rol: 'admin'
        })
      }
    }

    setOk(`Usuario ${form.email} creado correctamente`)
    setForm({ email: '', password: '', nombre: '' })
    setModal(false)
    setTimeout(() => setOk(''), 3000)
    cargarUsuarios()
    setGuardando(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn primary onClick={() => { setForm({ email: '', password: '', nombre: '' }); setError(''); setModal(true) }}>
          + Nuevo usuario
        </Btn>
      </div>

      {ok && (
        <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          ✓ {ok}
        </div>
      )}

      <Card>
        <CardTitle>Usuarios con acceso al sistema</CardTitle>
        <Table
          headers={['Email', 'Nombre', 'Empresa', 'Rol', 'Creado']}
          emptyMsg="No hay usuarios creados aún"
          rows={usuarios.map(u => ({
            cells: [
              u.user_id?.slice(0, 8) + '...',
              '—',
              u.empresa?.razon_social || '—',
              <Badge type="info">{u.rol}</Badge>,
              new Date(u.created_at).toLocaleDateString('es-AR')
            ]
          }))}
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <CardTitle>Cómo crear usuarios manualmente (recomendado)</CardTitle>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
          La forma más fácil es desde el panel de Supabase:<br/>
          <strong>1.</strong> Andá a <strong>Authentication → Users</strong> en Supabase<br/>
          <strong>2.</strong> Click en <strong>"Add user" → "Create new user"</strong><br/>
          <strong>3.</strong> Ingresá email y contraseña<br/>
          <strong>4.</strong> Luego ejecutá este SQL para vincularlo con la empresa:
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 12, background: 'var(--bg2)',
          borderRadius: 'var(--radius)', padding: 14, marginTop: 12,
          color: 'var(--text2)', lineHeight: 1.8
        }}>
          INSERT INTO usuarios_empresa (user_id, empresa_id, rol)<br/>
          VALUES (<br/>
          &nbsp;&nbsp;'UUID-DEL-USUARIO',&nbsp;&nbsp;-- lo ves en Auth → Users<br/>
          &nbsp;&nbsp;'UUID-DE-LA-EMPRESA',&nbsp;-- lo ves en Table Editor → empresas<br/>
          &nbsp;&nbsp;'admin'<br/>
          );
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo usuario"
        footer={<><Btn onClick={() => setModal(false)}>Cancelar</Btn><Btn primary onClick={crearUsuario} disabled={guardando}>{guardando ? 'Creando...' : 'Crear usuario'}</Btn></>}>
        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <Input label="Nombre (opcional)" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Martinez SRL" />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="cliente@ejemplo.com" />
        <Input label="Contraseña" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -8 }}>
          El usuario podrá cambiar su contraseña después de ingresar.
        </div>
      </Modal>
    </div>
  )
}
