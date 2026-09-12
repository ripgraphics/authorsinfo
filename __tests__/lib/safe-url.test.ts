import { assertPublicHttpUrl } from '@/lib/security/safe-url'

describe('assertPublicHttpUrl', () => {
  it('rejects localhost and private IPv4 destinations', async () => {
    await expect(assertPublicHttpUrl('http://localhost/admin')).rejects.toThrow()
    await expect(assertPublicHttpUrl('http://127.0.0.1/admin')).rejects.toThrow()
    await expect(assertPublicHttpUrl('http://192.168.1.10/admin')).rejects.toThrow()
  })

  it('rejects credential URLs and unsupported protocols', async () => {
    await expect(assertPublicHttpUrl('https://user:pass@example.com')).rejects.toThrow()
    await expect(assertPublicHttpUrl('file:///etc/passwd')).rejects.toThrow()
  })

  it('accepts a public hostname', async () => {
    await expect(assertPublicHttpUrl('https://1.1.1.1/path')).resolves.toBeInstanceOf(URL)
  })
})
