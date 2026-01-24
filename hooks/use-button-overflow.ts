'use client'

import { useState, useEffect, useRef, RefObject } from 'react'

/**
 * Hook to detect if buttons would overflow their container
 * Uses hidden measurement elements to measure full button widths
 * Returns true if buttons would overflow the container
 * 
 * @param containerRef - Ref to the container element (grid container for lists, button container for single components)
 * @param threshold - Minimum width in pixels before switching to compact mode (default: 350px)
 * @param isGrid - If true, measures button container width inside first card instead of grid width
 * @returns isCompact - Boolean indicating if buttons should be in compact/icon-only mode
 */
export function useButtonOverflow(
  containerRef: RefObject<HTMLElement | null>,
  threshold: number = 350,
  isGrid: boolean = false
): boolean {
  const [isCompact, setIsCompact] = useState(false)
  const measurementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      setIsCompact(false)
      return
    }

    // Create a hidden measurement container if it doesn't exist
    if (!measurementRef.current) {
      const measurementDiv = document.createElement('div')
      measurementDiv.style.position = 'absolute'
      measurementDiv.style.visibility = 'hidden'
      measurementDiv.style.pointerEvents = 'none'
      measurementDiv.style.top = '-9999px'
      measurementDiv.style.left = '-9999px'
      measurementDiv.style.whiteSpace = 'nowrap'
      measurementDiv.style.display = 'flex'
      measurementDiv.style.gap = '8px' // gap-2
      measurementDiv.style.alignItems = 'center'
      // Copy font styles from body to ensure accurate text measurement
      const bodyStyles = window.getComputedStyle(document.body)
      measurementDiv.style.fontFamily = bodyStyles.fontFamily
      measurementDiv.style.fontSize = bodyStyles.fontSize
      measurementDiv.style.fontWeight = bodyStyles.fontWeight
      document.body.appendChild(measurementDiv)
      measurementRef.current = measurementDiv
    }

    const measureFullButtonWidth = (label: string, hasIcon: boolean = true, variant: string = 'outline', size: string = 'sm'): number => {
      const measurementDiv = measurementRef.current!
      
      // Create a temporary button element with full content matching actual button styles
      const tempButton = document.createElement('button')
      // Match the actual button styles used in ResponsiveActionButton and Button component
      tempButton.style.display = 'inline-flex'
      tempButton.style.alignItems = 'center'
      tempButton.style.justifyContent = 'center'
      tempButton.style.gap = '8px' // gap-2
      tempButton.style.whiteSpace = 'nowrap'
      tempButton.style.borderRadius = '6px' // rounded-md
      tempButton.style.fontSize = '14px' // text-sm
      tempButton.style.fontWeight = '500' // font-medium
      tempButton.style.height = '36px' // h-9
      tempButton.style.paddingLeft = '12px' // px-3
      tempButton.style.paddingRight = '12px' // px-3
      tempButton.style.border = variant === 'default' ? 'none' : '1px solid hsl(var(--input))'
      tempButton.style.backgroundColor = variant === 'default' ? 'hsl(var(--primary))' : 'hsl(var(--background))'
      tempButton.style.color = variant === 'default' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
      
      if (hasIcon) {
        const iconSpan = document.createElement('span')
        iconSpan.style.width = '16px'
        iconSpan.style.height = '16px'
        iconSpan.style.display = 'inline-block'
        iconSpan.style.flexShrink = '0'
        // Add a small SVG placeholder to get accurate width (16px icon)
        iconSpan.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="currentColor" opacity="0.01"/></svg>'
        tempButton.appendChild(iconSpan)
      }
      
      const textSpan = document.createElement('span')
      textSpan.textContent = label
      textSpan.style.whiteSpace = 'nowrap'
      // Gap is handled by parent gap, no need for margin
      tempButton.appendChild(textSpan)
      
      measurementDiv.appendChild(tempButton)
      // Force layout calculation by reading offsetWidth
      const width = tempButton.offsetWidth
      measurementDiv.removeChild(tempButton)
      
      return width
    }

    const checkOverflow = () => {
      let shouldBeCompact = false

      if (isGrid) {
        // For grids, find the first card's button container
        const firstCard = container.querySelector('[data-card-item]') as HTMLElement
        if (firstCard) {
          const buttonContainer = firstCard.querySelector('[data-button-container]') as HTMLElement
          if (buttonContainer) {
            const containerWidth = buttonContainer.offsetWidth
            
            // Measure what full buttons would require
            // Use data attributes for reliable detection (works even when buttons are in compact mode)
            const buttonLabels: { label: string; hasIcon: boolean; variant?: string }[] = []
            
            // Check what buttons are actually rendered by looking at the container
            // Look for buttons and links with data attributes first (most reliable)
            const existingButtons = Array.from(buttonContainer.querySelectorAll('button, a[href]')) as HTMLElement[]
            
            if (existingButtons.length > 0) {
              existingButtons.forEach((btn) => {
                const buttonElement = btn as HTMLElement
                
                // First, try to get label from data attribute (most reliable - works even in compact mode)
                const dataLabel = buttonElement.getAttribute('data-button-label')
                const dataVariant = buttonElement.getAttribute('data-button-variant') || 'outline'
                const dataHasIcon = buttonElement.getAttribute('data-button-has-icon') === 'true'
                
                if (dataLabel) {
                  // Use data attributes - most reliable method
                  buttonLabels.push({
                    label: dataLabel,
                    hasIcon: dataHasIcon,
                    variant: dataVariant as 'default' | 'outline'
                  })
                  return // Skip other detection methods
                }
                
                // Fallback: Try to determine from other attributes
                const href = buttonElement.getAttribute('href')
                const text = buttonElement.textContent?.trim() || ''
                const hasIcon = buttonElement.querySelector('svg') !== null
                const isPrimary = buttonElement.classList.contains('bg-primary')
                const variant = isPrimary ? 'default' : 'outline'
                
                // Try to determine button type from href, aria-label, title, or text
                const ariaLabel = buttonElement.getAttribute('aria-label') || ''
                const title = buttonElement.getAttribute('title') || ''
                const allText = `${text} ${ariaLabel} ${title}`.toLowerCase()
                
                if (href && href.includes('/messages/')) {
                  buttonLabels.push({ label: 'Message', hasIcon: true, variant: 'default' })
                } else if (allText.includes('message')) {
                  buttonLabels.push({ label: 'Message', hasIcon: true, variant: 'default' })
                } else if (allText.includes('add friend') || (allText.includes('friend') && !allText.includes('remove'))) {
                  buttonLabels.push({ label: 'Add Friend', hasIcon: true, variant })
                } else if (allText.includes('follow') || allText.includes('unfollow')) {
                  buttonLabels.push({ label: 'Follow', hasIcon: true, variant })
                } else if (text.length > 2 && !text.match(/^[A-Z]$/)) {
                  // Use actual text if we can't determine type (but not single letters which might be icons)
                  buttonLabels.push({ label: text, hasIcon, variant })
                } else if (hasIcon && text.length === 0) {
                  // Icon-only button - we need to guess the label from context
                  // Check if it's a link (Message) or button (Add Friend/Follow)
                  if (href) {
                    buttonLabels.push({ label: 'Message', hasIcon: true, variant: 'default' })
                  } else {
                    // Could be Add Friend or Follow - use Add Friend as default
                    buttonLabels.push({ label: 'Add Friend', hasIcon: true, variant })
                  }
                }
              })
            }
            
            // If we couldn't detect buttons, use common button labels as fallback
            // This handles the case where buttons haven't rendered yet
            if (buttonLabels.length === 0) {
              // Default: assume Message and Add Friend buttons (most common in followers list)
              buttonLabels.push(
                { label: 'Message', hasIcon: true, variant: 'default' },
                { label: 'Add Friend', hasIcon: true, variant: 'outline' }
              )
            }
            
            // Remove duplicates (same label + variant)
            const uniqueButtons = buttonLabels.filter((btn, index, self) =>
              index === self.findIndex((b) => b.label === btn.label && b.variant === btn.variant)
            )
            
            // Measure total width required for all full buttons
            let totalButtonWidth = 0
            let gap = 8 // Default gap-2 = 8px
            
            // Try to get actual gap from computed style
            const computedStyle = window.getComputedStyle(buttonContainer)
            const gapValue = computedStyle.gap
            if (gapValue) {
              const gapMatch = gapValue.match(/(\d+)px/)
              if (gapMatch) {
                gap = parseFloat(gapMatch[1])
              }
            }
            
            // Measure each button's full width using the detected variant for each button
            const size = 'sm' // UserActionButtons uses size="sm"
            
            uniqueButtons.forEach(({ label, hasIcon, variant = 'outline' }) => {
              // Try to find a reference button with matching variant for accurate measurement
              const referenceButton = Array.from(existingButtons).find((btn) => {
                const btnVariant = btn.classList.contains('bg-primary') ? 'default' : 'outline'
                return btnVariant === variant
              }) as HTMLElement | undefined
              
              const buttonWidth = measureFullButtonWidth(label, hasIcon, variant, size, referenceButton)
              totalButtonWidth += buttonWidth
            })
            
            // Add gaps between buttons
            if (uniqueButtons.length > 1) {
              totalButtonWidth += gap * (uniqueButtons.length - 1)
            }
            
            // Add small buffer (10px) to account for rounding and ensure buttons don't touch edges
            const requiredWidth = totalButtonWidth + 10
            
            // Debug logging (only in development)
            if (process.env.NODE_ENV === 'development') {
              console.log('[ButtonOverflow] Measurement:', {
                containerWidth,
                totalButtonWidth,
                requiredWidth,
                buttonLabels: uniqueButtons.map(b => `${b.label} (${b.variant})`),
                gap,
                shouldBeCompact: requiredWidth > containerWidth,
                buttonsCount: uniqueButtons.length
              })
            }
            
            // If buttons would overflow, switch to compact
            shouldBeCompact = requiredWidth > containerWidth
          } else {
            // Fallback: measure card width and estimate
            const cardWidth = firstCard.offsetWidth
            const computedStyle = window.getComputedStyle(firstCard)
            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0
            const paddingRight = parseFloat(computedStyle.paddingRight) || 0
            const estimatedButtonWidth = cardWidth - paddingLeft - paddingRight
            shouldBeCompact = estimatedButtonWidth < threshold
          }
        } else {
          // Fallback: use threshold on container
          shouldBeCompact = container.offsetWidth < threshold
        }
      } else {
        // For single containers, measure the container directly
        shouldBeCompact = container.offsetWidth < threshold
      }

      setIsCompact(shouldBeCompact)
    }

    // Measurement function with proper timing
    const performMeasurement = () => {
      // Use requestAnimationFrame to ensure DOM is laid out
      requestAnimationFrame(() => {
        checkOverflow()
      })
    }

    // Check immediately
    performMeasurement()
    
    // Also check after delays to catch async rendering
    const timeout1 = setTimeout(performMeasurement, 100)
    const timeout2 = setTimeout(performMeasurement, 300)

    // Use ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce to avoid too many checks
      setTimeout(() => {
        performMeasurement()
      }, 50)
    })

    resizeObserver.observe(container)

    // Also observe first card and button container if it's a grid
    if (isGrid) {
      const firstCard = container.querySelector('[data-card-item]') as HTMLElement
      if (firstCard) {
        resizeObserver.observe(firstCard)
        const buttonContainer = firstCard.querySelector('[data-button-container]') as HTMLElement
        if (buttonContainer) {
          resizeObserver.observe(buttonContainer)
        }
      }
    }

    // Use MutationObserver to detect when buttons are added to DOM
    const mutationObserver = new MutationObserver((mutations) => {
      let shouldCheck = false
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if buttons were added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.querySelector('button, a')) {
                shouldCheck = true
              }
            }
          })
        }
      })
      if (shouldCheck) {
        setTimeout(performMeasurement, 50)
      }
    })

    if (isGrid) {
      const firstCard = container.querySelector('[data-card-item]') as HTMLElement
      if (firstCard) {
        const buttonContainer = firstCard.querySelector('[data-button-container]') as HTMLElement
        if (buttonContainer) {
          mutationObserver.observe(buttonContainer, {
            childList: true,
            subtree: true
          })
        }
      }
    } else {
      mutationObserver.observe(container, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      // Clean up measurement element
      if (measurementRef.current) {
        const parent = measurementRef.current.parentNode
        if (parent) {
          parent.removeChild(measurementRef.current)
        }
        measurementRef.current = null
      }
    }
  }, [containerRef, threshold, isGrid])

  return isCompact
}
