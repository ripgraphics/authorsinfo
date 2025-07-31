import React from 'react'

interface CloseButtonProps {
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CloseButton({
  onClick,
  className = '',
  size = 'md'
}: CloseButtonProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`html-div xdj266r xat24cr xexx8yu xyri2b x18d9i69 x1c1uobl xyqm7xq x1ys307a ${className}`}>
      <div
        aria-label="Close"
        className="x1i10hfl xjqpnuy xc5r6h4 xqeqjp1 x1phubyo x13fuv20 x18b5jzi x1q0q8m5 x1t7ytsu x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x14z9mp xat24cr x1lziwak x2lwn1j xeuugli x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 x1iwo8zk x1033uif x179ill4 x1b60jn0 x972fbf x10w94by x1qhh985 x14e42zd x9f619 x78zum5 xl56j7k xexx8yu xyri2b x18d9i69 x1c1uobl x1n2onr6 xc9qbxq x14qfxbe x1qhmfi1"
        role="button"
        tabIndex={0}
        onClick={onClick}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          aria-hidden="true"
          className="xfx01vb x1lliihq x1tzjh5l x1k90msu x2h7rmj x1qfuztq"
          style={{ '--color': 'var(--primary-icon)' } as React.CSSProperties}
        >
          <path d="M19.884 5.884a1.25 1.25 0 0 0-1.768-1.768L12 10.232 5.884 4.116a1.25 1.25 0 1 0-1.768 1.768L10.232 12l-6.116 6.116a1.25 1.25 0 0 0 1.768 1.768L12 13.768l6.116 6.116a1.25 1.25 0 0 0 1.768-1.768L13.768 12l6.116-6.116z"></path>
        </svg>
        <div
          className="x1ey2m1c xtijo5x x1o0tod xg01cxk x47corl x10l6tqk x13fuv20 x1ebt8du x19991ni x1dhq9h x1iwo8zk x1033uif x179ill4 x1b60jn0"
          role="none"
          data-visualcompletion="ignore"
          style={{ inset: '0px' }}
        />
      </div>
    </div>
  )
} 