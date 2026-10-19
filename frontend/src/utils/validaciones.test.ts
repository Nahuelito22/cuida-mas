import { describe, expect, it } from 'vitest'
import { tokenVencido, validarRegistro } from './validaciones'

describe('validarRegistro', () => {
  const valido = {
    email: 'ana@mail.com',
    password: 'Clave1234',
    nombre: 'Ana',
    apellido: 'Pérez',
    dni: '30111222',
    rol: 'PACIENTE' as const,
  }

  it('no devuelve errores con datos válidos', () => {
    expect(validarRegistro(valido)).toEqual({})
  })

  it('detecta DNI, email y contraseña inválidos', () => {
    const errores = validarRegistro({ ...valido, dni: '30.111.222', email: 'ana', password: '123' })
    expect(Object.keys(errores).sort()).toEqual(['dni', 'email', 'password'])
  })
})

describe('tokenVencido', () => {
  const token = (exp: number) => `x.${btoa(JSON.stringify({ exp }))}.y`

  it('reconoce un token vigente y uno vencido', () => {
    const ahora = Math.floor(Date.now() / 1000)
    expect(tokenVencido(token(ahora + 60))).toBe(false)
    expect(tokenVencido(token(ahora - 60))).toBe(true)
  })

  it('trata un token mal formado como vencido', () => {
    expect(tokenVencido('basura')).toBe(true)
  })
})
