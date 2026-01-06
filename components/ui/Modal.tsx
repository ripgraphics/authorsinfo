'use client'
import { useEffect, useRef } from 'react'

export default function Modal({
  open,
  onClose,
  children,
  title,
  icon,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  icon?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Focus trap and close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const focusable = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    if (ref.current) ref.current.focus()
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-2xl p-0 max-w-lg w-full relative animate-modal-in focus:outline-none"
        ref={ref}
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            {title && <h2 className="text-xl font-bold">{title}</h2>}
          </div>
          <button
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            aria-label="Close modal"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4" style={{ flex: 1 }}>
          {children}
        </div>
      </div>
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.2s;
        }
        .animate-modal-in {
          animation: scaleIn 0.2s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
