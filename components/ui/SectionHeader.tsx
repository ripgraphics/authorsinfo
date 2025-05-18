import * as React from "react"

interface SectionHeaderProps {
  title: React.ReactNode
  right?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function SectionHeader({
  title,
  right,
  className = "",
  children,
}: SectionHeaderProps) {
  return (
    <div className={`section-header flex justify-between items-center ${className}`}>
      <h2 className="section-header__title text-2xl font-semibold leading-none tracking-tight">{title}</h2>
      {right && <div className="section-header__right">{right}</div>}
      {children}
    </div>
  )
} 