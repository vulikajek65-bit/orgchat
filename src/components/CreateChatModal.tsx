import { X } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import type { ChatType, Department, MemberWithProfile } from '../types/database';

export interface CreateChatInput {
  title: string;
  type: ChatType;
  departmentId: string | null;
  description: string;
  participantIds: string[];
}

interface CreateChatModalProps {
  open: boolean;
  departments: Department[];
  members: MemberWithProfile[];
  onClose: () => void;
  onCreate: (input: CreateChatInput) => Promise<void>;
}

export const CreateChatModal = ({
  open,
  departments,
  members,
  onClose,
  onCreate,
}: CreateChatModalProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChatType>('project');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const needsParticipants = type === 'project' || type === 'urgent';
  const visibleMembers = useMemo(() => members, [members]);

  if (!open) {
    return null;
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Укажите название беседы.');
      return;
    }
    if (type === 'department' && !departmentId) {
      setError('Выберите отдел.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreate({
        title: title.trim(),
        type,
        departmentId: departmentId || null,
        description: description.trim(),
        participantIds,
      });
      onClose();
    } catch (createError) {
      console.error('Failed to create chat.', createError);
      setError(createError instanceof Error ? createError.message : 'Не удалось создать беседу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-3 sm:items-center sm:justify-center">
      <section className="w-full max-w-xl rounded-lg bg-white p-5 shadow-soft">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Создать беседу</h2>
          <button aria-label="Закрыть" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4">
          <Field label="Название беседы">
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Тип беседы">
            <select value={type} onChange={(event) => setType(event.target.value as ChatType)}>
              <option value="general">Общий</option>
              <option value="department">Отдел</option>
              <option value="project">Проект</option>
              <option value="urgent">Срочный</option>
              <option value="announcement">Объявления</option>
            </select>
          </Field>
          {type === 'department' ? (
            <Field label="Отдел">
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">Выберите отдел</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Описание">
            <input value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          {needsParticipants ? (
            <div>
              <p className="mb-2 text-sm font-medium">Участники</p>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {visibleMembers.map((member) => (
                  <label className="flex items-center gap-2 text-sm" key={member.id}>
                    <input
                      checked={participantIds.includes(member.user_id)}
                      onChange={(event) =>
                        setParticipantIds((current) =>
                          event.target.checked
                            ? [...current, member.user_id]
                            : current.filter((id) => id !== member.user_id),
                        )
                      }
                      type="checkbox"
                    />
                    {member.profile.full_name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-600">Ошибка: {error}</p> : null}

        <button
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-60"
          disabled={loading}
          onClick={() => void handleCreate()}
          type="button"
        >
          {loading ? 'Создаем...' : 'Создать беседу'}
        </button>
      </section>
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) => (
  <label className="block text-sm font-medium [&_input]:mt-2 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_input]:py-2 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:px-3 [&_select]:py-2">
    {label}
    {children}
  </label>
);
