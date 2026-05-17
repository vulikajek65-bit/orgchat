import { RotateCcw, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UiSettings } from '../utils/uiSettings';

interface SettingsPanelProps {
  open: boolean;
  settings: UiSettings;
  error: string;
  onClose: () => void;
  onChange: <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => void;
  onReset: () => void;
}

export const SettingsPanel = ({
  open,
  settings,
  error,
  onClose,
  onChange,
  onReset,
}: SettingsPanelProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/45 p-3 sm:items-center sm:justify-center">
      <section className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-soft">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Настройки интерфейса</h2>
            <p className="mt-1 text-sm text-slate-500">
              Изменения применяются сразу и сохраняются только на этом устройстве.
            </p>
          </div>
          <button
            aria-label="Закрыть настройки"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingGroup label="Размер интерфейса">
            <SegmentedControl
              onChange={(value) => onChange('interfaceSize', value)}
              options={[
                ['compact', 'Компактный'],
                ['standard', 'Стандартный'],
                ['large', 'Крупный'],
              ]}
              value={settings.interfaceSize}
            />
          </SettingGroup>

          <SettingGroup label="Плотность сообщений">
            <SegmentedControl
              onChange={(value) => onChange('messageDensity', value)}
              options={[
                ['compact', 'Компактная'],
                ['normal', 'Обычная'],
                ['spacious', 'Просторная'],
              ]}
              value={settings.messageDensity}
            />
          </SettingGroup>

          <SettingGroup label="Левая панель">
            <SegmentedControl
              onChange={(value) => onChange('leftSidebarSize', value)}
              options={[
                ['narrow', 'Узкая'],
                ['normal', 'Обычная'],
                ['wide', 'Широкая'],
              ]}
              value={settings.leftSidebarSize}
            />
          </SettingGroup>

          <SettingGroup label="Правая панель">
            <SegmentedControl
              onChange={(value) => onChange('rightSidebarSize', value)}
              options={[
                ['narrow', 'Узкая'],
                ['normal', 'Обычная'],
                ['wide', 'Широкая'],
              ]}
              value={settings.rightSidebarSize}
            />
          </SettingGroup>

          <SettingGroup label="Тема">
            <SegmentedControl
              onChange={(value) => onChange('theme', value)}
              options={[
                ['light', 'Светлая'],
                ['dark', 'Темная'],
                ['system', 'Системная'],
              ]}
              value={settings.theme}
            />
          </SettingGroup>

          <SettingGroup label="Вид сообщений">
            <SegmentedControl
              onChange={(value) => onChange('messageView', value)}
              options={[
                ['bubbles', 'Пузырьки'],
                ['rows', 'Строки'],
              ]}
              value={settings.messageView}
            />
          </SettingGroup>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-600">Ошибка: {error}</p> : null}

        <footer className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Настройки сохраняются в localStorage.</p>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={onReset}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            Сбросить настройки
          </button>
        </footer>
      </section>
    </div>
  );
};

const SettingGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
    {children}
  </div>
);

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}

const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) => (
  <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
    {options.map(([optionValue, label]) => (
      <button
        className={`rounded-md px-2 py-2 text-sm transition ${
          optionValue === value ? 'bg-white font-medium text-slate-950 shadow-sm' : 'text-slate-500'
        }`}
        key={optionValue}
        onClick={() => onChange(optionValue)}
        type="button"
      >
        {label}
      </button>
    ))}
  </div>
);
