import { render, screen } from '@testing-library/react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

const mockPathname = jest.fn<string, []>()

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { src, alt, width, height, ...rest } = props
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src as string} alt={alt as string} {...rest} />
  },
}))

describe('AdminSidebar theme tokens and section expansion', () => {
  beforeEach(() => {
    mockPathname.mockReset()
  })

  it('expands the Settings section when on the test runner route', () => {
    mockPathname.mockReturnValue('/admin/settings/test-runner')
    render(<AdminSidebar />)

    const link = screen.getByRole('link', { name: /test runner/i })
    expect(link).toHaveAttribute('href', '/admin/settings/test-runner')
  })

  it('marks the test runner link active with theme tokens, not hardcoded white', () => {
    mockPathname.mockReturnValue('/admin/settings/test-runner')
    render(<AdminSidebar />)

    const link = screen.getByRole('link', { name: /test runner/i })
    expect(link.className).toContain('bg-sidebar-primary')
    expect(link.className).toContain('text-sidebar-primary-foreground')
    // Regression guard: white-on-white made the active link invisible
    expect(link.className).not.toContain('bg-white/10')
    expect(link.className).not.toContain('hover:bg-white/10')
    expect(link.className).not.toContain('text-white ')
  })

  it('changes the active link background on hover so there is visible interaction', () => {
    mockPathname.mockReturnValue('/admin/settings/test-runner')
    render(<AdminSidebar />)

    const link = screen.getByRole('link', { name: /test runner/i })
    // Active links must adopt the app standard primary hover (same as
    // <Button variant="default">), not hover back to their own color.
    expect(link.className).toContain('hover:bg-app-theme-blue')
    expect(link.className).toContain('hover:text-accent-foreground')
    expect(link.className).not.toContain('hover:bg-sidebar-primary')
  })

  it('uses theme tokens for hover on inactive links', () => {
    mockPathname.mockReturnValue('/admin/roles')
    render(<AdminSidebar />)

    const link = screen.getByRole('link', { name: /test runner/i })
    expect(link.className).toContain('hover:bg-sidebar-accent')
    expect(link.className).toContain('hover:text-sidebar-accent-foreground')
    expect(link.className).not.toContain('hover:bg-white/10')
  })

  it('hides the test runner link when the Settings section is collapsed', () => {
    mockPathname.mockReturnValue('/admin')
    render(<AdminSidebar />)

    expect(screen.queryByRole('link', { name: /test runner/i })).not.toBeInTheDocument()
  })

  it('does not render any hardcoded white background utility in the sidebar', () => {
    mockPathname.mockReturnValue('/admin/settings/test-runner')
    const { container } = render(<AdminSidebar />)

    const offenders = Array.from(container.querySelectorAll('*'))
      .map((el) => el.className)
      .filter((cls): cls is string => typeof cls === 'string')
      .filter((cls) => cls.includes('bg-white/'))

    expect(offenders).toEqual([])
  })
})
