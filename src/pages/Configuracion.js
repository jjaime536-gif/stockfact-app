import React, { useState, useEffect } from 'react'
import { Card, CardTitle, Input, Select, Btn, Grid } from '../components/UI'
import { updateEmpresa, subirLogo } from '../supabase'

export default function Configuracion({ empresa, recargar }) {
  const [form, setForm] = useState({
    razon_social: '', cuit: '', condicion_iva: 'Responsable Inscripto',
    domicilio: '', telefono: '', email: '', inicio_actividades: '', punto_venta_default: 1
  })
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    if (empresa) {
      setForm(f => ({ ...f, ...empresa }))
      if (empresa.logo_url) setLogoPreview(empresa.logo_url)
    }
  }, [empresa])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleLogo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!empresa?.id) { alert('Guardá los datos de la empresa primero'); return }
    
    // Preview inmediato
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
    
    setSubiendoLogo(true)
    const { url, error } = await subirLogo(empresa.id, file)
    if (error) alert('Error al subir el logo: ' + error.message)
    else { setLogoPreview(url); recargar() }
    setSubiendoLogo(false)
  }

  const guardar = async () => {
    if (!empresa?.id) return
    setGuardando(true)
    await updateEmpresa(empresa.id, form)
    setOk(true); setTimeout(() => setOk(false), 2500)
    recargar(); setGuardando(false)
  }

  return (
    <div>
      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>Datos del emisor</CardTitle>
          <Input label="Razón social / Nombre" value={form.razon_social} onChange={e => f('razon_social', e.target.value)} placeholder="Juan Manuel Jaime Jiménez" />
          <Grid cols={2} gap={12}>
            <Input label="CUIT" value={form.cuit} onChange={e => f('cuit', e.target.value)} placeholder="20-12345678-9" />
            <Select label="Condición IVA" value={form.condicion_iva} onChange={e => f('condicion_iva', e.target.value)}>
              {['Responsable Inscripto','Monotributista','Exento','No responsable'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Grid>
          <Input label="Domicilio fiscal" value={form.domicilio} onChange={e => f('domicilio', e.target.value)} placeholder="Calle, número, ciudad" />
          <Grid cols={2} gap={12}>
            <Input label="Teléfono" value={form.telefono} onChange={e => f('telefono', e.target.value)} placeholder="383-4348763" />
            <Input label="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="correo@ejemplo.com" />
          </Grid>
          <Grid cols={2} gap={12}>
            <Input label="Inicio de actividades" type="date" value={form.inicio_actividades || ''} onChange={e => f('inicio_actividades', e.target.value)} />
            <Select label="Punto de venta default" value={form.punto_venta_default} onChange={e => f('punto_venta_default', parseInt(e.target.value))}>
              <option value={1}>0001</option><option value={2}>0002</option>
            </Select>
          </Grid>
          {/* Logo */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>Logo de la empresa</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 'var(--radius)',
                border: '0.5px solid var(--border2)', background: 'var(--bg2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0
              }}>
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 24, color: 'var(--text3)' }}>🏢</span>
                }
              </div>
              <div>
                <label style={{
                  display: 'inline-block', padding: '7px 14px',
                  background: 'var(--bg)', border: '0.5px solid var(--border2)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13,
                  color: 'var(--text)', fontWeight: 500
                }}>
                  {subiendoLogo ? 'Subiendo...' : '📁 Elegir imagen'}
                  <input type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} disabled={subiendoLogo} />
                </label>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>PNG, JPG o SVG. Se muestra en el sidebar y en los comprobantes.</div>
              </div>
            </div>
          </div>

          {ok && <div style={{ color: 'var(--green)', fontSize: 13, marginBottom: 10 }}>✓ Guardado correctamente</div>}
          <Btn primary onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : '💾 Guardar cambios'}</Btn>
        </Card>

        <div>
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Alícuotas IVA disponibles</CardTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Exento 0%','No gravado','2,5%','5%','10,5%','21%','27%'].map(a => (
                <span key={a} style={{ background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{a}</span>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Conexión Supabase</CardTitle>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.6 }}>
              La app está conectada a tu proyecto de Supabase mediante el archivo <code>.env</code>.<br/>
              Para cambiar la base de datos, editá ese archivo con la nueva URL y key.
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 12, color: 'var(--text2)' }}>
              REACT_APP_SUPABASE_URL=https://rnaivkvthbrcqakzadbp.supabase.co<br/>
              REACT_APP_SUPABASE_KEY=sb_publishable_***
            </div>
          </Card>

          <Card>
            <CardTitle>Información del sistema</CardTitle>
            <table style={{ fontSize: 13, width: '100%' }}>
              {[['Versión','1.0.0'],['Base de datos','Supabase PostgreSQL'],['Región','South America (São Paulo)'],['ARCA','Pendiente configuración']].map(([k,v]) => (
                <tr key={k}><td style={{ color: 'var(--text2)', padding: '5px 0' }}>{k}</td><td style={{ textAlign: 'right', color: 'var(--text)' }}>{v}</td></tr>
              ))}
            </table>
          </Card>
        </div>
      </Grid>
    </div>
  )
}
