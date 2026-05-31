import React, { useState } from 'react'
import { Card, CardTitle, Input, Select, Btn, Grid, Badge } from '../components/UI'

export default function ARCA({ empresa }) {
  const [cuit, setCuit] = useState(empresa?.cuit || '')
  const [ambiente, setAmbiente] = useState('homologacion')

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Conexión Web Service ARCA</CardTitle>
        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 14, fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.8 }}>
          Para emitir facturas electrónicas reales necesitás:<br/>
          <strong>1.</strong> Certificado digital (.crt) generado en el portal de ARCA<br/>
          <strong>2.</strong> Clave privada (.key) del certificado<br/>
          <strong>3.</strong> CUIT habilitado para facturación electrónica<br/>
          <strong>4.</strong> Autorizar el servicio <em>wsfe</em> en Administrador de Relaciones de ARCA
        </div>
        <Grid cols={2} gap={12}>
          <Input label="CUIT emisor" value={cuit} onChange={e => setCuit(e.target.value)} placeholder="20-12345678-9" />
          <Select label="Ambiente" value={ambiente} onChange={e => setAmbiente(e.target.value)}>
            <option value="homologacion">Homologación (prueba)</option>
            <option value="produccion">Producción</option>
          </Select>
        </Grid>
        <Grid cols={2} gap={12}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Certificado (.crt)</label>
            <input type="file" accept=".crt,.pem" style={{ fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Clave privada (.key)</label>
            <input type="file" accept=".key,.pem" style={{ fontSize: 13 }} />
          </div>
        </Grid>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn primary>⊕ Conectar y probar</Btn>
          <Btn>⤓ Instructivo PDF</Btn>
        </div>
      </Card>

      <Grid cols={2} gap={16}>
        <Card>
          <CardTitle>Estado actual</CardTitle>
          <table style={{ width: '100%', fontSize: 13 }}>
            {[
              ['WSFE (Factura electrónica)', <Badge type="danger">No conectado</Badge>],
              ['WSAA (Autenticación)', <Badge type="danger">No conectado</Badge>],
              ['Ambiente', <Badge type="gray">Sin configurar</Badge>],
              ['Último CAE emitido', '—'],
              ['Vto. último CAE', '—'],
            ].map(([k,v],i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text2)', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>{k}</td>
                <td style={{ textAlign: 'right', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>{v}</td>
              </tr>
            ))}
          </table>
        </Card>

        <Card>
          <CardTitle>Cómo obtener el certificado</CardTitle>
          <ol style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 2, paddingLeft: 18 }}>
            <li>Ingresá a <strong>arca.gob.ar</strong> con clave fiscal nivel 3</li>
            <li>Servicios → Administración de Certificados Digitales</li>
            <li>Generá un CSR con OpenSSL</li>
            <li>Subí el CSR y descargá el .crt</li>
            <li>Autorizá el servicio <em>wsfe</em> en Administrador de Relaciones</li>
            <li>Cargá el .crt y la .key en esta pantalla</li>
          </ol>
        </Card>
      </Grid>
    </div>
  )
}
