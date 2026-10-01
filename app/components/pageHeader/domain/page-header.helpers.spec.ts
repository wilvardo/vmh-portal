import { describe, expect, it } from 'vitest'
import { splitPageTitle } from './page-header.helpers'

describe('splitPageTitle', () => {
  it('agrega el punto de marca a un titulo que no lo trae', () => {
    expect(splitPageTitle('Reservas')).toEqual({ text: 'Reservas', mark: '.' })
  })

  it('separa el punto que el titulo ya trae para pintarlo en el acento', () => {
    expect(splitPageTitle('Buenas tardes, Administracion.')).toEqual({
      text: 'Buenas tardes, Administracion',
      mark: '.'
    })
  })

  it('respeta un titulo que cierra con pregunta', () => {
    expect(splitPageTitle('¿Que vas a ajustar hoy?')).toEqual({
      text: '¿Que vas a ajustar hoy?',
      mark: ''
    })
  })

  it('respeta un titulo que cierra con exclamacion o dos puntos', () => {
    expect(splitPageTitle('Listo!').mark).toBe('')
    expect(splitPageTitle('Resumen:').mark).toBe('')
  })

  it('no inventa punto en un titulo vacio', () => {
    expect(splitPageTitle('   ')).toEqual({ text: '', mark: '' })
  })
})
