import { useState, type FormEvent, type ReactElement } from 'react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';

export interface EmployeeRegistrationInput {
  fullName: string;
  email: string;
  password: string;
  inviteCode: string;
  position: string;
  workStart: string;
  workEnd: string;
}

interface RegisterEmployeeProps {
  onBack: () => void;
  onSubmit: (input: EmployeeRegistrationInput) => Promise<void>;
}

export const RegisterEmployee = ({ onBack, onSubmit }: RegisterEmployeeProps) => {
  const [form, setForm] = useState<EmployeeRegistrationInput>({
    fullName: '',
    email: '',
    password: '',
    inviteCode: '',
    position: '',
    workStart: '09:00',
    workEnd: '17:00',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof EmployeeRegistrationInput, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(form);
    } catch (submitError) {
      console.error('Employee registration failed in form submit.', submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось присоединиться к организации.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <button
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      <div className="rounded-lg bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">Регистрация сотрудника</h2>
        <p className="mt-2 text-sm text-slate-500">Присоединитесь по коду приглашения.</p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Имя">
            <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} required />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          </Field>
          <Field label="Пароль">
            <input type="password" minLength={6} value={form.password} onChange={(event) => updateField('password', event.target.value)} required />
          </Field>
          <Field label="Код организации">
            <input value={form.inviteCode} onChange={(event) => updateField('inviteCode', event.target.value.toUpperCase())} required />
          </Field>
          <Field label="Должность">
            <input value={form.position} onChange={(event) => updateField('position', event.target.value)} required />
          </Field>
          <div className="hidden sm:block" />
          <Field label="Начало рабочего дня">
            <input type="time" value={form.workStart} onChange={(event) => updateField('workStart', event.target.value)} required />
          </Field>
          <Field label="Конец рабочего дня">
            <input type="time" value={form.workEnd} onChange={(event) => updateField('workEnd', event.target.value)} required />
          </Field>

          {error ? (
            <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Ошибка: {error}
            </p>
          ) : null}

          <button
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
            disabled={loading}
            type="submit"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Присоединиться
          </button>
        </form>
      </div>
    </section>
  );
};

const Field = ({ label, children }: { label: string; children: ReactElement }) => (
  <label className="block text-sm font-medium [&_input]:mt-2 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_input]:py-2 [&_input]:outline-none [&_input]:ring-brand-500 focus-within:[&_input]:ring-2">
    {label}
    {children}
  </label>
);
