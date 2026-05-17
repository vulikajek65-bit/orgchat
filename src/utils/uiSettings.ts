export interface UiSettings {
  interfaceSize: 'compact' | 'standard' | 'large';
  messageDensity: 'compact' | 'normal' | 'spacious';
  leftSidebarSize: 'narrow' | 'normal' | 'wide';
  rightSidebarSize: 'narrow' | 'normal' | 'wide';
  theme: 'light' | 'dark' | 'system';
  messageView: 'bubbles' | 'rows';
}

const storageKey = 'orgchat.uiSettings';

export const defaultUiSettings: UiSettings = {
  interfaceSize: 'standard',
  messageDensity: 'normal',
  leftSidebarSize: 'normal',
  rightSidebarSize: 'normal',
  theme: 'light',
  messageView: 'bubbles',
};

export const loadUiSettings = (): UiSettings => {
  try {
    const rawSettings = localStorage.getItem(storageKey);

    if (!rawSettings) {
      return defaultUiSettings;
    }

    return { ...defaultUiSettings, ...(JSON.parse(rawSettings) as Partial<UiSettings>) };
  } catch (error) {
    console.error('Failed to load UI settings.', error);
    return defaultUiSettings;
  }
};

export const saveUiSettings = (settings: UiSettings) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save UI settings.', error);
    throw new Error('Не удалось сохранить настройки интерфейса.');
  }
};

export const resetUiSettings = () => {
  try {
    localStorage.removeItem(storageKey);
    // TODO(next step): перенести пользовательские настройки в таблицу user_settings.
    return defaultUiSettings;
  } catch (error) {
    console.error('Failed to reset UI settings.', error);
    throw new Error('Не удалось сбросить настройки интерфейса.');
  }
};
