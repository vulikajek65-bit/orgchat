import { ArrowRight, Building2, UserRound } from 'lucide-react';

interface AuthLandingProps {
  onOwnerClick: () => void;
  onEmployeeClick: () => void;
  onLoginClick: () => void;
}

export const AuthLanding = ({
  onOwnerClick,
  onEmployeeClick,
  onLoginClick,
}: AuthLandingProps) => (
  <section className="relative isolate min-h-screen overflow-hidden bg-[linear-gradient(135deg,#082f49_0%,#0f172a_55%,#164e63_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-200">OrgChat</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Рабочий мессенджер для организаций
          </h1>
        </div>
      </header>

      <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-lg text-slate-200">Уважает рабочее время сотрудников.</p>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Создайте организацию или присоединитесь по коду, общайтесь в рабочих чатах и
            сразу видьте, кто сейчас на смене.
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur">
          <button
            className="group flex w-full items-center justify-between rounded-lg bg-white p-4 text-left text-slate-950 transition hover:bg-sky-50"
            onClick={onOwnerClick}
            type="button"
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-brand-600" />
              <span>
                <span className="block text-lg font-semibold">Я руководитель</span>
                <span className="block text-sm text-slate-500">Создать новую организацию</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </button>

          <button
            className="group flex w-full items-center justify-between rounded-lg bg-white p-4 text-left text-slate-950 transition hover:bg-sky-50"
            onClick={onEmployeeClick}
            type="button"
          >
            <span className="flex items-center gap-3">
              <UserRound className="h-6 w-6 text-emerald-600" />
              <span>
                <span className="block text-lg font-semibold">Я сотрудник</span>
                <span className="block text-sm text-slate-500">
                  Присоединиться к организации по коду
                </span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </button>

          <button
            className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            onClick={onLoginClick}
            type="button"
          >
            Уже есть аккаунт? Войти
          </button>
        </div>
      </div>

      <div className="grid gap-3 pb-3 text-sm text-slate-300 sm:grid-cols-3">
        <span>Общий чат</span>
        <span>Рабочие часы</span>
        <span>Срочные сообщения</span>
      </div>
    </div>
  </section>
);
