import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Department, MemberRole } from '../types/database';

interface DepartmentsPanelProps {
  departments: Department[];
  currentRole: MemberRole;
  onCreate: (name: string, description: string) => Promise<void>;
  onUpdate: (departmentId: string, name: string) => Promise<void>;
  onDelete: (departmentId: string) => Promise<void>;
}

export const DepartmentsPanel = ({
  departments,
  currentRole,
  onCreate,
  onUpdate,
  onDelete,
}: DepartmentsPanelProps) => {
  const canManage = currentRole === 'owner' || currentRole === 'admin';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createDepartment = async () => {
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
    } catch (createError) {
      console.error('Failed to create department.', createError);
      setError(createError instanceof Error ? createError.message : 'Не удалось создать отдел.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg bg-white/10 p-3 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-slate-400">Отделы</h2>
        <span className="text-xs text-slate-400">{departments.length}</span>
      </div>

      {canManage ? (
        <div className="mb-3 space-y-2">
          <input
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
            onChange={(event) => setName(event.target.value)}
            placeholder="Название отдела"
            value={name}
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Описание"
            value={description}
          />
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
            disabled={loading || !name.trim()}
            onClick={() => void createDepartment()}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Создать отдел
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        {departments.map((department) => (
          <article className="rounded-lg bg-white/10 p-3" key={department.id}>
            {editingId === department.id ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
                  onChange={(event) => setEditingName(event.target.value)}
                  value={editingName}
                />
                <button
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950"
                  onClick={() => {
                    void onUpdate(department.id, editingName.trim()).then(() => setEditingId(null));
                  }}
                  type="button"
                >
                  Сохранить
                </button>
              </div>
            ) : (
              <>
                <p className="font-medium">{department.name}</p>
                {department.description ? (
                  <p className="mt-1 text-xs text-slate-300">{department.description}</p>
                ) : null}
                {canManage ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      aria-label="Изменить отдел"
                      className="rounded-lg bg-white/10 p-2"
                      onClick={() => {
                        setEditingId(department.id);
                        setEditingName(department.name);
                      }}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Удалить отдел"
                      className="rounded-lg bg-white/10 p-2"
                      onClick={() => void onDelete(department.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-200">Ошибка: {error}</p> : null}
    </section>
  );
};
