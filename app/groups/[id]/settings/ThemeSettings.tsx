import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'react-hot-toast';

interface ThemeSettings {
  theme_mode: 'light' | 'dark' | 'system';
  custom_theme: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    text_color?: string;
  };
}

interface Props {
  groupId: string;
  userId: string;
  isAdmin: boolean;
}

export default function ThemeSettings({ groupId, userId, isAdmin }: Props) {
  const [settings, setSettings] = useState<ThemeSettings>({
    theme_mode: 'system',
    custom_theme: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchThemeSettings();
  }, [groupId]);

  const fetchThemeSettings = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('theme_mode, custom_theme')
      .eq('id', groupId)
      .single();

    if (error) {
      toast.error('Failed to load theme settings');
      return;
    }

    setSettings({
      theme_mode: (data as any).theme_mode || 'system',
      custom_theme: (data as any).custom_theme || {}
    });
    setIsLoading(false);
  };

  const handleThemeModeChange = async (mode: 'light' | 'dark' | 'system') => {
    if (!isAdmin) {
      toast.error('Only admins can change theme settings');
      return;
    }

    const { error } = await (supabase
      .from('groups') as any)
      .update({
        theme_mode: mode,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    if (error) {
      toast.error('Failed to update theme mode');
      return;
    }

    setSettings(prev => ({ ...prev, theme_mode: mode }));
    toast.success('Theme mode updated');
  };

  const handleCustomThemeChange = async (key: string, value: string) => {
    if (!isAdmin) {
      toast.error('Only admins can change theme settings');
      return;
    }

    const newCustomTheme = {
      ...settings.custom_theme,
      [key]: value
    };

    const { error } = await (supabase
      .from('groups') as any)
      .update({
        custom_theme: newCustomTheme,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    if (error) {
      toast.error('Failed to update custom theme');
      return;
    }

    setSettings(prev => ({
      ...prev,
      custom_theme: newCustomTheme
    }));
    toast.success('Custom theme updated');
  };

  if (isLoading) {
    return <div>Loading theme settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
        
        {/* Theme Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme Mode
          </label>
          <div className="flex gap-4">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleThemeModeChange(mode)}
                disabled={!isAdmin}
                className={`px-4 py-2 rounded-lg border ${
                  settings.theme_mode === mode
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Theme Colors */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Custom Theme Colors
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'primary_color', label: 'Primary Color' },
              { key: 'secondary_color', label: 'Secondary Color' },
              { key: 'accent_color', label: 'Accent Color' },
              { key: 'background_color', label: 'Background Color' },
              { key: 'text_color', label: 'Text Color' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm text-gray-600 mb-1">
                  {label}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.custom_theme[key as keyof typeof settings.custom_theme] || '#000000'}
                    onChange={(e) => handleCustomThemeChange(key, e.target.value)}
                    disabled={!isAdmin}
                    className={`w-10 h-10 rounded cursor-pointer ${
                      !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <input
                    type="text"
                    value={settings.custom_theme[key as keyof typeof settings.custom_theme] || ''}
                    onChange={(e) => handleCustomThemeChange(key, e.target.value)}
                    disabled={!isAdmin}
                    placeholder="#000000"
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isAdmin && (
        <p className="text-sm text-gray-500 italic">
          Only group admins can modify theme settings
        </p>
      )}
    </div>
  );
} 