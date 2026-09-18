import { describe, it, expect } from 'vitest'

import {
  classifyNeonSql,
  classifyBashCommand,
  extractEnvHosts,
  findProdHost
} from '../../scripts/agent-safety/db-and-data-guard.mjs'

describe('classifyNeonSql', () => {
  it('permite un SELECT simple', () => {
    expect(classifyNeonSql('SELECT id, name FROM users').readOnly).toBe(true)
  })

  it('permite SELECT en minusculas', () => {
    expect(classifyNeonSql('select 1').readOnly).toBe(true)
  })

  it('permite un CTE que termina en SELECT', () => {
    expect(classifyNeonSql('WITH t AS (SELECT 1) SELECT * FROM t').readOnly).toBe(true)
  })

  it('permite EXPLAIN sin ANALYZE', () => {
    expect(classifyNeonSql('EXPLAIN SELECT * FROM users').readOnly).toBe(true)
  })

  it('ignora comentarios de bloque al clasificar', () => {
    expect(classifyNeonSql('SELECT 1 /* nota */').readOnly).toBe(true)
  })

  it('bloquea un DELETE', () => {
    expect(classifyNeonSql('DELETE FROM users WHERE id = 1').readOnly).toBe(false)
  })

  it('bloquea un INSERT', () => {
    expect(classifyNeonSql("INSERT INTO users (name) VALUES ('x')").readOnly).toBe(false)
  })

  it('bloquea un DROP TABLE', () => {
    expect(classifyNeonSql('DROP TABLE users').readOnly).toBe(false)
  })

  it('bloquea un TRUNCATE', () => {
    expect(classifyNeonSql('TRUNCATE users').readOnly).toBe(false)
  })

  it('bloquea multiples sentencias separadas por punto y coma', () => {
    expect(classifyNeonSql('SELECT 1; DROP TABLE users').readOnly).toBe(false)
  })

  it('bloquea una escritura oculta tras un SELECT en un EXPLAIN ANALYZE', () => {
    expect(classifyNeonSql('EXPLAIN ANALYZE DELETE FROM users').readOnly).toBe(false)
  })

  it('bloquea un SQL vacio', () => {
    expect(classifyNeonSql('   ').readOnly).toBe(false)
  })

  it('bloquea una sentencia que no inicia con palabra de lectura', () => {
    expect(classifyNeonSql('GRANT ALL ON users TO app').readOnly).toBe(false)
  })
})

describe('extractEnvHosts', () => {
  it('extrae los hosts de BASE_API_PATH y SOCKET', () => {
    const env = 'BASE_API_PATH="https://api.prod.example/api"\nSOCKET="https://socket.prod.example"'
    expect(extractEnvHosts(env)).toEqual(['api.prod.example', 'socket.prod.example'])
  })

  it('ignora valores que no son URL', () => {
    expect(extractEnvHosts('BASE_API_PATH=no-es-url')).toEqual([])
  })

  it('devuelve vacio cuando no hay variables relevantes', () => {
    expect(extractEnvHosts('HOST=127.0.0.1\nPORT=3000')).toEqual([])
  })
})

describe('findProdHost', () => {
  it('detecta coincidencia por substring', () => {
    expect(findProdHost(['api.vmh.com'], ['vmh.com'])).toBe('api.vmh.com')
  })

  it('devuelve null cuando la lista de prod esta vacia', () => {
    expect(findProdHost(['api.vmh.com'], [])).toBeNull()
  })

  it('devuelve null cuando ningun host coincide', () => {
    expect(findProdHost(['127.0.0.1:3333'], ['vmh.com'])).toBeNull()
  })
})

describe('classifyBashCommand', () => {
  const noProd = { envContent: '', prodHosts: [] as string[] }

  it('bloquea una migracion destructiva de Adonis', () => {
    expect(classifyBashCommand('node ace migration:fresh', noProd).blocked).toBe(true)
  })

  it('bloquea un prisma migrate reset', () => {
    expect(classifyBashCommand('pnpm dlx prisma migrate reset', noProd).blocked).toBe(true)
  })

  it('bloquea la invocacion directa de psql', () => {
    expect(classifyBashCommand('psql -c "select 1"', noProd).blocked).toBe(true)
  })

  it('no confunde mysql2 (paquete npm) con el cliente mysql', () => {
    expect(classifyBashCommand('pnpm add mysql2', noProd).blocked).toBe(false)
  })

  it('permite un comando inocuo', () => {
    expect(classifyBashCommand('pnpm lint', noProd).blocked).toBe(false)
  })

  it('bloquea arrancar dev cuando el .env apunta a un host prod', () => {
    const context = {
      envContent: 'BASE_API_PATH="https://api.vmh.com/api"',
      prodHosts: ['vmh.com']
    }
    expect(classifyBashCommand('pnpm dev', context).blocked).toBe(true)
  })

  it('permite arrancar dev cuando el .env apunta a localhost', () => {
    const context = {
      envContent: 'BASE_API_PATH="http://127.0.0.1:3333/api"',
      prodHosts: ['vmh.com']
    }
    expect(classifyBashCommand('pnpm dev', context).blocked).toBe(false)
  })

  it('deja inerte el guard de host cuando la lista prod esta vacia (placeholder)', () => {
    const context = {
      envContent: 'BASE_API_PATH="https://api.vmh.com/api"',
      prodHosts: []
    }
    expect(classifyBashCommand('pnpm test', context).blocked).toBe(false)
  })
})
