'use client'

import { useEffect, useState } from 'react'

/**
 * Dev-only page: runs worst-case button width measurement (Message + Request Received + More + gaps + buffer)
 * for UserListLayout min-width. Visit /demo/measure-button-widths and read data-measurement-result.
 */
export default function MeasureButtonWidthsPage() {
  const [result, setResult] = useState<{ minCardWidth: number; mMsg: number; mFriend: number } | null>(null)

  useEffect(() => {
    const div = document.createElement('div')
    div.style.cssText =
      'position:absolute;visibility:hidden;top:-9999px;left:-9999px;white-space:nowrap;display:flex;gap:8px;align-items:center;'
    const bodyStyles = window.getComputedStyle(document.body)
    div.style.fontFamily = bodyStyles.fontFamily
    div.style.fontSize = bodyStyles.fontSize
    document.body.appendChild(div)

    const measure = (label: string, variant: 'default' | 'outline') => {
      const btn = document.createElement('button')
      btn.style.display = 'inline-flex'
      btn.style.alignItems = 'center'
      btn.style.justifyContent = 'center'
      btn.style.gap = '8px'
      btn.style.whiteSpace = 'nowrap'
      btn.style.fontSize = '14px'
      btn.style.fontWeight = '500'
      btn.style.height = '36px'
      btn.style.paddingLeft = '12px'
      btn.style.paddingRight = '12px'
      btn.style.border = variant === 'default' ? 'none' : '1px solid hsl(var(--input))'
      btn.style.backgroundColor = variant === 'default' ? 'hsl(var(--primary))' : 'hsl(var(--background))'
      btn.style.color = variant === 'default' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
      const icon = document.createElement('span')
      icon.style.width = '16px'
      icon.style.height = '16px'
      icon.style.display = 'inline-block'
      icon.style.flexShrink = '0'
      icon.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="currentColor" opacity="0.01"/></svg>'
      btn.appendChild(icon)
      const text = document.createElement('span')
      text.textContent = label
      text.style.whiteSpace = 'nowrap'
      btn.appendChild(text)
      div.appendChild(btn)
      const w = btn.offsetWidth
      div.removeChild(btn)
      return w
    }

    const mMsg = measure('Message', 'default')
    const mFriend = measure('Request Received', 'outline')
    const worstCaseTotal = mMsg + mFriend + 36 + 16 + 10
    const minCardWidth = worstCaseTotal + 24

    document.body.removeChild(div)
    setResult({ minCardWidth, mMsg, mFriend })
  }, [])

  if (!result) {
    return (
      <div className="p-8">
        <p>Measuring…</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-4" data-measurement-result={result.minCardWidth}>
      <h1 className="text-xl font-semibold">Button width measurement (worst case)</h1>
      <pre className="bg-muted p-4 rounded-md text-sm">
        {JSON.stringify(
          {
            mMsg: result.mMsg,
            mFriend: result.mFriend,
            worstCaseTotal: result.mMsg + result.mFriend + 62,
            minCardWidth: result.minCardWidth,
          },
          null,
          2
        )}
      </pre>
      <p className="text-muted-foreground">
        Use <strong>min-w-[{result.minCardWidth}px]</strong> for UserListLayout card wrapper.
      </p>
    </div>
  )
}
