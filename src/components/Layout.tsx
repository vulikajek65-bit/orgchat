import type { ReactNode } from 'react';
import type { UiSettings } from '../utils/uiSettings';
import { getThemeClass } from '../utils/uiClasses';

interface LayoutProps {
  children: ReactNode;
  settings?: UiSettings;
}

export const Layout = ({ children, settings }: LayoutProps) => (
  <main className={`min-h-screen bg-mist text-ink ${getThemeClass(settings?.theme ?? 'light')}`}>
    {children}
  </main>
);
