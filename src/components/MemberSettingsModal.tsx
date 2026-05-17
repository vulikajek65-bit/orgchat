import { X } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import type { Department, MemberRole, MemberWithProfile } from '../types/database';
import { MemberStatusBadge } from './MemberStatusBadge';

interface MemberSettingsModalProps {
  member: MemberWithProfile | null;
  departments: Department[];
  editable: boolean;
  canDemoteOwner: boolean;
  onClose: () => void;
  onSave: (
    memberId: string,
    patch: {
      position: string;
      role: MemberRole;
      department_id: string | null;
      work_start: string;
      work_end: string;
    },
  ) => Promise<void>;
}

export const MemberSettingsModal = ({
  member,
  departments,
  editable,
  canDemoteOwner,
  onClose,
  onSave,
}: MemberSettingsModalProps) => {
  const [position, setPosition] = useState(member?.position ?? '');
  const [role, setRole] = useState<MemberRole>(member?.role ?? 'employee');
  const [departmentId, setDepartmentId] = useState(member?.department_id ?? '');
  const [workStart, setWorkStart] = useState(member?.work_start?.slice(0, 5) ?? '09:00');
  const [workEnd, setWorkEnd] = useState(member?.work_end?.slice(0, 5) ?? '17:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPosition(member?.position ?? '');
    setRole(member?.role ?? 'employee');
    setDepartmentId(member?.department_id ?? '');
    setWorkStart(member?.work_start?.slice(0, 5) ?? '09:00');
    setWorkEnd(member?.work_end?.slice(0, 5) ?? '17:00');
    setError('');
  }, [member]);

  if (!member) {
    return null;
  }

  const save = async () => {
    if (member.role === 'owner' && role !== 'owner' && !canDemoteOwner) {
      setError('Нельзя понизить единственного владельца.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(member.id, {
        position,
        role,
        department_id: departmentId || null,
        work_start: workStart,
        work_end: workEnd,
      });
      onClose();
    } catch (saveError) {
      console.error('Failed to update member.', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить сотрудника.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-3 sm:items-center sm:justify-center">
      <section className="w-full max-w-lg rounded-lg bg-white p-5 shadow-soft">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{member.profile.full_name}</h2>
            <p className="text-sm text-slate-500">Email: недоступен в текущей схеме</p>
          </div>
          <button aria-label="Закрыть" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mb-4">
          <MemberStatusBadge member={member} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Должность">
            <input disabled={!editable} value={position} onChange={(event) => setPosition(event.target.value)} />
          </Field>
          <Field label="Роль">
            <select disabled={!editable} value={role} onChange={(event) => setRole(event.target.value as MemberRole)}>
              <option value="owner">Владелец</option>
              <option value="admin">Администратор</option>
              <option value="manager">Руководитель отдела</option>
              <option value="employee">Сотрудник</option>
            </select>
          </Field>
          <Field label="Отдел">
            <select disabled={!editable} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Без отдела</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Начало дня">
            <input disabled={!editable} type="time" value={workStart} onChange={(event) => setWorkStart(event.target.value)} />
          </Field>
          <Field label="Конец дня">
            <input disabled={!editable} type="time" value={workEnd} onChange={(event) => setWorkEnd(event.target.value)} />
          </Field>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-600">Ошибка: {error}</p> : null}

        {editable ? (
          <button
            className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-60"
            disabled={loading}
            onClick={() => void save()}
            type="button"
          >
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        ) : null}
      </section>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactElement }) => (
  <label className="block text-sm font-medium [&_input]:mt-2 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_input]:py-2 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:px-3 [&_select]:py-2">
    {label}
    {children}
  </label>
);
