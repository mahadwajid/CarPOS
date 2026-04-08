import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const res = await window.electronAPI.settings.get();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (updates) => {
    const res = await window.electronAPI.settings.update(updates);
    if (res.success) {
      await loadSettings();
      return true;
    }
    return false;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading, reloadSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
