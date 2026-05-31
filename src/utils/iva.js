// Alícuotas y comportamiento según condición IVA del emisor

export const ALICUOTAS_TODAS = [
  { v: 0,    l: 'Exento 0%'  },
  { v: -1,   l: 'No gravado' },
  { v: 2.5,  l: '2,5%'       },
  { v: 5,    l: '5%'         },
  { v: 10.5, l: '10,5%'      },
  { v: 21,   l: '21%'        },
  { v: 27,   l: '27%'        },
]

export function getAlicuotas(condicionIva) {
  const c = (condicionIva || '').toLowerCase()
  if (c.includes('monotribut')) return ALICUOTAS_TODAS  // no se usa, ver esMono
  if (c.includes('exento'))     return ALICUOTAS_TODAS  // idem
  return ALICUOTAS_TODAS
}

export function getAlicuotaDefault(condicionIva) {
  const c = (condicionIva || '').toLowerCase()
  if (c.includes('monotribut')) return 0
  if (c.includes('exento'))     return 0
  return 21
}

// true = el emisor es monotributista o exento → sin IVA en comprobante
export function esSinIva(condicionIva) {
  const c = (condicionIva || '').toLowerCase()
  return c.includes('monotribut') || c.includes('exento')
}
