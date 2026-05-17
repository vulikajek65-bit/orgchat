import { Settings2 } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = ({ onClick }: SettingsButtonProps) => (
  <button
    className="inline-flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-3 text-left text-white transition hover:bg-white/15"
    onClick={onClick}
    type="button"
  >
    <Settings2 className="h-4 w-4" />
    Настройки
  </button>
);
