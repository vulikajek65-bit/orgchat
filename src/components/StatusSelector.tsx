import { useState } from 'react';
import type { AvailabilityStatus, MemberWithProfile } from '../types/database';
import { getMemberDisplayStatus } from '../utils/memberStatus';

interface StatusSelectorProps {
  member: MemberWithProfile;
  onChange: (status: AvailabilityStatus, statusUntil: string | null) => Promise<void>;
}

const statusOptions: { value: AvailabilityStatus; label: string }[] = [
  { value: 'auto', label: 'Авто' },
  { value: 'working', label: 'На смене' },
  { value: 'break', label: 'Перерыв' },
  { value: 'busy', label: 'Занят' },
  { value: 'off', label: 'Не на смене' },
  { value: 'vacation', label: 'Отпуск' },
];

const durationOptions = [
  { value: '15', label: '15 минут' },
  { value: '30', label: '30 минут' },
  { value: '60', label: '1 час' },
  { value: 'end_of_day', label: 'До конца дня' },
];

export const StatusSelector = ({ member, onChange }: StatusSelectorProps) => {
  const initialStatus =
    member.availability_status !== 'auto' &&
    member.status_until &&
    new Date(member.status_until) <= new Date()
      ? 'auto'
      : member.availability_status ?? 'auto';
  const [status, setStatus] = useState<AvailabilityStatus>(initialStatus);
  const [duration, setDuration] = useState('30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const calculateUntil = (nextStatus: AvailabilityStatus) => {
    if (!['break', 'busy'].includes(nextStatus)) {
      return null;
    }

    const until = new Date();
    if (duration === 'end_of_day') {
      until.setHours(23, 59, 59, 999);
    } else {
      until.setMinutes(until.getMinutes() + Number(duration));
    }
    return until.toISOString();
  };

  const saveStatus = async (nextStatus: AvailabilityStatus) => {
    setSaving(true);
    setError('');
    try {
      setStatus(nextStatus);
      await onChange(nextStatus, calculateUntil(nextStatus));
    } catch (statusError) {
      console.error('Failed to update own status.', statusError);
      setError(statusError instanceof Error ? statusError.message : 'Не удалось изменить статус.');
      setStatus(member.availability_status);
    } finally {
      setSaving(false);
    }
  };

  const updateDuration = async (nextDuration: string) => {
    setDuration(nextDuration);
    if (!['break', 'busy'].includes(status)) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const until = new Date();
      if (nextDuration === 'end_of_day') {
        until.setHours(23, 59, 59, 999);
      } else {
        until.setMinutes(until.getMinutes() + Number(nextDuration));
      }
      await onChange(status, until.toISOString());
    } catch (statusError) {
      console.error('Failed to update status duration.', statusError);
      setError(statusError instanceof Error ? statusError.message : 'Не удалось изменить статус.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg bg-white/10 p-3">
      <p className="text-xs uppercase text-slate-400">Мой статус</p>
      <div className="mt-2 flex flex-col gap-2">
        <select
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
          disabled={saving}
          onChange={(event) => void saveStatus(event.target.value as AvailabilityStatus)}
          value={status}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {['break', 'busy'].includes(status) ? (
          <select
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
            disabled={saving}
            onChange={(event) => void updateDuration(event.target.value)}
            value={duration}
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Сейчас: {getMemberDisplayStatus(member) === 'working' ? 'На смене' : 'Не на смене или ручной статус'}
      </p>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </section>
  );
};
