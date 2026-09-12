import { promises as dns } from 'node:dns'
import net from 'node:net'

const PRIVATE_HOSTNAMES = new Set(['localhost', 'localhost.localdomain'])

function isPrivateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) return true
  const [a, b] = octets
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  )
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase()
  if (normalized.startsWith('::ffff:')) {
    const mappedIpv4 = normalized.slice('::ffff:'.length)
    return net.isIPv4(mappedIpv4) && isPrivateIpv4(mappedIpv4)
  }
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('2001:db8:')
  )
}

function isPrivateAddress(address: string): boolean {
  return net.isIPv4(address) ? isPrivateIpv4(address) : isPrivateIpv6(address)
}

export async function assertPublicHttpUrl(input: string): Promise<URL> {
  const parsed = new URL(input)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported')
  }
  if (parsed.username || parsed.password) throw new Error('Credential URLs are not supported')

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '')
  if (PRIVATE_HOSTNAMES.has(hostname) || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new Error('Private network destinations are not allowed')
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error('Private network destinations are not allowed')
    return parsed
  }

  const addresses = await dns.lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Private network destinations are not allowed')
  }
  return parsed
}
