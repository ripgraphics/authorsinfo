import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface ThemeContextType {
  themeMode: 'light' | 'dark' | 'system'
  customTheme: {
    primary_color?: string
    secondary_color?: string
    accent_color?: string
    background_color?: string
    text_color?: string
  }
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  customTheme: {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface Props {
  groupId: string
  children: React.ReactNode
}

export default function ThemeProvider({ groupId, children }: Props) {
  const [theme, setTheme] = useState<ThemeContextType>({
    themeMode: 'system',
    customTheme: {},
  })
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial theme settings
    fetchThemeSettings()

    // Subscribe to theme changes
    const channel = supabase
      .channel('group_theme_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        (payload) => {
          setTheme({
            themeMode: payload.new.theme_mode || 'system',
            customTheme: payload.new.custom_theme || {},
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  const fetchThemeSettings = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('theme_mode, custom_theme')
      .eq('id', groupId)
      .single()

    if (error) {
      console.error('Failed to fetch theme settings:', error)
      return
    }

    setTheme({
      themeMode: (data as any).theme_mode || 'system',
      customTheme: (data as any).custom_theme || {},
    })
  }

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Apply custom theme colors
    Object.entries(theme.customTheme).forEach(([key, value]) => {
      if (value) {
        const cssVar = `--${key.replace('_', '-')}`
        root.style.setProperty(cssVar, value)
      }
    })

    // Apply theme mode
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const effectiveTheme = theme.themeMode === 'system' ? systemTheme : theme.themeMode
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme.themeMode === 'system') {
        root.classList.remove('light', 'dark')
        root.classList.add(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
