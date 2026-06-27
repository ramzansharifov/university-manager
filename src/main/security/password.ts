import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const passwordHashAlgorithm = 'scrypt'
const keyLength = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, keyLength).toString('hex')

  return `${passwordHashAlgorithm}$${salt}$${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, hash] = storedHash.split('$')

  if (algorithm !== passwordHashAlgorithm || !salt || !hash) {
    return false
  }

  const storedHashBuffer = Buffer.from(hash, 'hex')
  const passwordHashBuffer = scryptSync(password, salt, storedHashBuffer.length)

  if (storedHashBuffer.length !== passwordHashBuffer.length) {
    return false
  }

  return timingSafeEqual(storedHashBuffer, passwordHashBuffer)
}
