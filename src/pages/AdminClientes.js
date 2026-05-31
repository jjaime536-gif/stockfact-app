import React, { useState, useEffect } from 'react'
import { Card, CardTitle, Btn, Table, Modal, Input, Select, Badge } from '../components/UI'
import { supabase } from '../supabase'

const CONDICIONES_IVA = [
  'Responsable Inscripto', 'Monotributista', 'Exento', 'No responsable', 'Consumidor Final'
]

const EMPTY_FORM = {
  // Empresa
  razon_social: '', cuit: '', condicion_iva: 'Monotributista',
  domicilio: '', telefono: '', email_empresa: '', inicio_actividades: '',
  // Usuario
  email_usuario: '', password: ''
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [paso, setPaso] = useState(1) // 1: datos empresa, 2: usuario

  const cargar = async () => {
    // Traer todas las empresas con su usuario vinculado
    const { data } = await supabase
      .from('empresas')
      .select('*, usuarios_empresa(user_id, rol, es_admin, created_at)')
      .order('razon_social')
    setClientes(data || [])
  }

  useEffect(() => { cargar() }, [])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const abrirNuevo = () => {
    setForm(EMPTY_FORM)
    setError('')
    setPaso(1)
    setModal(true)
  }

  const siguiente = () => {
    if (!form.razon_social) { setError('La razón social es obligatoria'); return }
    if (!form.cuit) { setError('El CUIT es obligatorio'); return }
    setError('')
    setPaso(2)
  }

  const crear = async () => {
    if (!form.email_usuario) { setError('El email del usuario es obligatorio'); return }
    if (!form.password || form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setGuardando(true); setError('')

    try {
      // 1. Crear empresa
      const { data: emp, error: empErr } = await supabase
        .from('empresas')
        .insert({
          razon_social: form.razon_social,
          cuit: form.cuit,
          condicion_iva: form.condicion_iva,
          domicilio: form.domicilio,
          telefono: form.telefono,
          email: form.email_empresa,
          inicio_actividades: form.inicio_actividades || null,
          punto_venta_default: 1,
          arca_produccion: false
        })
        .select()
        .single()

      if (empErr) { setError('Error al crear empresa: ' + empErr.message); setGuardando(false); return }

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email_usuario,
        password: form.password,
        options: {
          data: { nombre: form.razon_social }
        }
      })

      if (authErr) {
        // Si falla el usuario, borrar la empresa creada
        await supabase.from('empresas').delete().eq('id', emp.id)
        setError('Error al crear usuario: ' + authErr.message)
        setGuardando(false); return
      }

      // 3. Vincular usuario con empresa
      const userId = authData.user?.id
      if (userId) {
        const { error: vincErr } = await supabase
          .from('usuarios_empresa')
          .insert({ user_id: userId, empresa_id: emp.id, rol: 'admin', es_admin: false })

        if (vincErr) {
          setError('Usuario creado pero no se pudo vincular: ' + vincErr.message)
          setGuardando(false); return
        }
      }

      setOk(`Cliente "${form.razon_social}" creado correctamente. Usuario: ${form.email_usuario}`)
      setModal(false)
      setTimeout(() => setOk(''), 4000)
      cargar()
    } catch (e) {
      setError('Error inesperado: ' + e.message)
    }
    setGuardando(false)
  }

  const resetPassword = async (empresaId) => {
    const nuevoEmail = prompt('Email del usuario a resetear:')
    if (!nuevoEmail) return
    const nuevaPass = prompt('Nueva contraseña (mín. 6 caracteres):')
    if (!nuevaPass || nuevaPass.length < 6) { alert('Contraseña muy corta'); return }
    alert('Para resetear contraseñas usá Supabase → Authentication → Users → Edit user.\nEsta función requiere permisos de Service Role.')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Btn primary onClick={abrirNuevo}>+ Nuevo cliente</Btn>
      </div>

      {ok && (
        <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 'var(--radius)', padding: '10px 16px', fontSize: 13, marginBottom: 16 }}>
          ✓ {ok}
        </div>
      )}

      <Card>
        <CardTitle>Clientes registrados</CardTitle>
        <Table
          headers={['Razón social', 'CUIT', 'Condición IVA', 'Domicilio', 'Usuarios', '']}
          emptyMsg="No hay clientes aún. Creá el primero."
          rows={clientes.map(c => ({
            cells: [
              <strong>{c.razon_social}</strong>,
              c.cuit,
              <Badge type={c.condicion_iva?.includes('Mono') ? 'warning' : 'info'}>{c.condicion_iva}</Badge>,
              c.domicilio || '—',
              <Badge type={c.usuarios_empresa?.length > 0 ? 'success' : 'gray'}>
                {c.usuarios_empresa?.length || 0} usuario{c.usuarios_empresa?.length !== 1 ? 's' : ''}
              </Badge>,
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn sm onClick={() => {
                  setForm({ ...EMPTY_FORM, ...c, email_empresa: c.email || '' })
                  setError('')
                  setPaso(1)
                  setModal(true)
                }}>✎ Editar</Btn>
              </div>
            ]
          }))}
        />
      </Card>

      {/* Modal crear/editar cliente */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.id ? 'Editar cliente' : `Nuevo cliente — Paso ${paso} de 2`}
        footer={
          paso === 1
            ? <><Btn onClick={() => setModal(false)}>Cancelar</Btn><Btn primary onClick={siguiente}>Siguiente →</Btn></>
            : <><Btn onClick={() => setPaso(1)}>← Atrás</Btn><Btn primary onClick={crear} disabled={guardando}>{guardando ? 'Creando...' : 'Crear cliente'}</Btn></>
        }
      >
        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 'var(--radius)' }}>{error}</div>}

        {paso === 1 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
              Datos de la empresa del cliente
            </div>
            <Input label="Razón social / Nombre *" value={form.razon_social} onChange={e => f('razon_social', e.target.value)} placeholder="Juan García" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <Input label="CUIT *" value={form.cuit} onChange={e => f('cuit', e.target.value)} placeholder="20-12345678-9" />
              <Select label="Condición IVA" value={form.condicion_iva} onChange={e => f('condicion_iva', e.target.value)}>
                {CONDICIONES_IVA.map(c => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <Input label="Domicilio" value={form.domicilio} onChange={e => f('domicilio', e.target.value)} placeholder="Calle, número, ciudad" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <Input label="Teléfono" value={form.telefono} onChange={e => f('telefono', e.target.value)} placeholder="383-1234567" />
              <Input label="Email empresa" type="email" value={form.email_empresa} onChange={e => f('email_empresa', e.target.value)} placeholder="cliente@ejemplo.com" />
            </div>
            <Input label="Inicio de actividades" type="date" value={form.inicio_actividades} onChange={e => f('inicio_actividades', e.target.value)} />
          </>
        )}

        {paso === 2 && (
          <>
            <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text2)' }}>
              <strong style={{ color: 'var(--text)' }}>{form.razon_social}</strong><br/>
              CUIT: {form.cuit} — {form.condicion_iva}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
              Creá el acceso al sistema para este cliente. Podés usar cualquier email, real o inventado.
            </div>
            <Input
              label="Email de acceso *"
              type="email"
              value={form.email_usuario}
              onChange={e => f('email_usuario', e.target.value)}
              placeholder="cliente@tuestudio.com o cualquier email"
            />
            <Input
              label="Contraseña *"
              type="password"
              value={form.password}
              onChange={e => f('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: -8 }}>
              Anotá estos datos para dárselos al cliente. El email no necesita ser real.
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
