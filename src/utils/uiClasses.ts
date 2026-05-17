import type { UiSettings } from './uiSettings';

export const getInterfaceSizeClasses = (settings: UiSettings) => ({
  root:
    settings.interfaceSize === 'compact'
      ? 'text-sm'
      : settings.interfaceSize === 'large'
        ? 'text-lg'
        : 'text-base',
  panelPadding:
    settings.interfaceSize === 'compact'
      ? 'p-3'
      : settings.interfaceSize === 'large'
        ? 'p-6'
        : 'p-4',
  cardPadding:
    settings.interfaceSize === 'compact'
      ? 'p-3'
      : settings.interfaceSize === 'large'
        ? 'p-5'
        : 'p-4',
  controlPadding:
    settings.interfaceSize === 'compact'
      ? 'px-3 py-2'
      : settings.interfaceSize === 'large'
        ? 'px-5 py-4'
        : 'px-4 py-3',
  messageText:
    settings.interfaceSize === 'compact'
      ? 'text-sm'
      : settings.interfaceSize === 'large'
        ? 'text-lg'
        : 'text-base',
});

export const getMessageDensityClasses = (settings: UiSettings) =>
  settings.messageDensity === 'compact'
    ? 'space-y-2'
    : settings.messageDensity === 'spacious'
      ? 'space-y-5'
      : 'space-y-3';

export const getSidebarWidthClasses = (settings: UiSettings) => ({
  left:
    settings.leftSidebarSize === 'narrow'
      ? 'lg:grid-cols-[240px_minmax(0,1fr)]'
      : settings.leftSidebarSize === 'wide'
        ? 'lg:grid-cols-[340px_minmax(0,1fr)]'
        : 'lg:grid-cols-[280px_minmax(0,1fr)]',
  right:
    settings.rightSidebarSize === 'narrow'
      ? 'lg:grid-cols-[minmax(0,1fr)_260px]'
      : settings.rightSidebarSize === 'wide'
        ? 'lg:grid-cols-[minmax(0,1fr)_380px]'
        : 'lg:grid-cols-[minmax(0,1fr)_320px]',
});

export const getThemeClass = (theme: UiSettings['theme']) => {
  if (theme === 'dark') {
    return 'theme-dark';
  }

  if (theme === 'system') {
    return 'theme-system';
  }

  return 'theme-light';
};
