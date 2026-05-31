# StockFact AR

Sistema de stock y facturación con soporte ARCA/AFIP. React + Supabase.

## Setup en 3 pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
El archivo `.env` ya tiene las credenciales de Supabase. Si necesitás cambiarlo:
```
REACT_APP_SUPABASE_URL=https://TU-PROYECTO.supabase.co
REACT_APP_SUPABASE_KEY=sb_publishable_...
```

### 3. Correr la app
```bash
npm start
```
Abre http://localhost:3000

## Deploy en Vercel (gratis)
1. Crear cuenta en vercel.com
2. `npm install -g vercel`
3. `vercel` (seguir los pasos)
4. Agregar las variables de entorno en el dashboard de Vercel

## Estructura
```
src/
  supabase.js          # Cliente y todas las funciones de DB
  App.js               # Navegación principal
  pages/
    Dashboard.js       # Métricas y resumen
    Stock.js           # ABM de productos + ajustes
    Facturacion.js     # Emisión y gestión de comprobantes
    Reportes.js        # Libro IVA + exportación CSV
    Configuracion.js   # Datos del emisor
    ARCA.js            # Configuración Web Service ARCA/AFIP
  components/
    UI.js              # Componentes reutilizables
```

## Tablas en Supabase
Ver archivo `schema_supabase.sql` para el schema completo.

## ARCA / AFIP
La integración con el Web Service de facturación electrónica está preparada
en la pantalla ARCA. Cuando tengas el certificado (.crt) y la clave (.key),
se agrega el llamado al WS desde el backend (Supabase Edge Functions o servidor propio).
