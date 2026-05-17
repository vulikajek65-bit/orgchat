import { useState, type FormEvent } from 'react';
import { ArrowLeft, LoaderCircle, LogIn } from 'lucide-react';

interface LoginProps {
  onBack: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const Login = ({ onBack, onSubmit }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(email, password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось войти.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <button
        className="mb-6 inline-flex items-center gap-2 self-start text-sm text-slate-500 hover:text-slate-800"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      <div className="rounded-lg bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">Вход</h2>
        <p className="mt-2 text-sm text-slate-500">Вернитесь в свою организацию OrgChat.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-brand-500 focus:ring-2"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block text-sm font-medium">
            Пароль
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-brand-500 focus:ring-2"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Войти
          </button>
        </form>
      </div>
    </section>
  );
};
