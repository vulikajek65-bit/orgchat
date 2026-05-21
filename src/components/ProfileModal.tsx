import { Camera, ContactRound, LoaderCircle, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import type { MemberWithProfile, Profile, UserContact } from '../types/database';
import { formatWorkTime } from '../utils/workTime';
import { MemberStatusBadge } from './MemberStatusBadge';

interface ImportedContact {
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface ProfileModalProps {
  open: boolean;
  member: MemberWithProfile | null;
  currentUser: Profile;
  contacts: UserContact[];
  onClose: () => void;
  onImportContacts: (contacts: ImportedContact[]) => Promise<void>;
  canManageMember: boolean;
  onOpenMemberSettings: (member: MemberWithProfile) => void;
  onSaveProfile: (
    patch: Pick<Profile, 'full_name' | 'avatar_url' | 'birth_date' | 'personal_status' | 'phone'>,
  ) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
}

type ContactNavigator = Navigator & {
  contacts?: {
    select: (
      properties: Array<'name' | 'tel' | 'email'>,
      options?: { multiple?: boolean },
    ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
  };
};

export const ProfileModal = ({
  open,
  member,
  currentUser,
  contacts,
  onClose,
  onImportContacts,
  canManageMember,
  onOpenMemberSettings,
  onSaveProfile,
  onUploadAvatar,
}: ProfileModalProps) => {
  const isOwnProfile = member?.user_id === currentUser.id;
  const profile = member?.profile ?? currentUser;
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [personalStatus, setPersonalStatus] = useState(profile.personal_status ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const contactPickerSupported = Boolean((navigator as ContactNavigator).contacts?.select);

  const visibleContacts = useMemo(
    () => contacts.slice().sort((left, right) => left.contact_name.localeCompare(right.contact_name)),
    [contacts],
  );

  useEffect(() => {
    setFullName(profile.full_name);
    setAvatarUrl(profile.avatar_url ?? '');
    setBirthDate(profile.birth_date ?? '');
    setPhone(profile.phone ?? '');
    setPersonalStatus(profile.personal_status ?? '');
    setError('');
  }, [profile]);

  if (!open || !member) {
    return null;
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOwnProfile) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSaveProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
        birth_date: birthDate || null,
        phone: phone.trim() || null,
        personal_status: personalStatus.trim() || null,
      });
    } catch (saveError) {
      console.error('Failed to save profile.', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить профиль.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError('');
    try {
      const publicUrl = await onUploadAvatar(file);
      setAvatarUrl(publicUrl);
      await onSaveProfile({
        full_name: fullName.trim(),
        avatar_url: publicUrl,
        birth_date: birthDate || null,
        phone: phone.trim() || null,
        personal_status: personalStatus.trim() || null,
      });
    } catch (uploadError) {
      console.error('Failed to upload avatar.', uploadError);
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить аватар.');
    } finally {
      setUploading(false);
    }
  };

  const importPhoneContacts = async () => {
    setImporting(true);
    setError('');
    try {
      const selected = await (navigator as ContactNavigator).contacts?.select(
        ['name', 'tel', 'email'],
        { multiple: true },
      );

      if (!selected?.length) {
        return;
      }

      await onImportContacts(
        selected.map((contact) => ({
          name: contact.name?.[0] ?? contact.tel?.[0] ?? contact.email?.[0] ?? 'Контакт',
          phone: contact.tel?.[0] ?? null,
          email: contact.email?.[0] ?? null,
        })),
      );
    } catch (importError) {
      console.error('Failed to import phone contacts.', importError);
      setError('Не удалось импортировать контакты. Возможно, браузер не дал доступ.');
    } finally {
      setImporting(false);
    }
  };

  const initials = profile.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-3 sm:items-center sm:justify-center">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-soft">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{isOwnProfile ? 'Мой профиль' : 'Профиль сотрудника'}</p>
            <h2 className="text-2xl font-semibold">{profile.full_name}</h2>
          </div>
          <button aria-label="Закрыть" className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-lg bg-slate-50 p-4">
            <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-panel text-3xl font-semibold text-white">
              {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : initials}
            </div>
            {isOwnProfile ? (
              <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium">
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Загрузить аватар
                <input accept="image/*" className="hidden" disabled={uploading} onChange={uploadAvatar} type="file" />
              </label>
            ) : null}
            {member ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <MemberStatusBadge member={member} />
                <p>{member.position || 'Без должности'}</p>
                <p>{roleLabel[member.role]}</p>
                <p>{member.department?.name ?? 'Без отдела'}</p>
                <p>
                  {formatWorkTime(member.work_start)}-{formatWorkTime(member.work_end)}
                </p>
              </div>
            ) : null}
            {canManageMember ? (
              <button
                className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                onClick={() => onOpenMemberSettings(member)}
                type="button"
              >
                Управление сотрудником
              </button>
            ) : null}
          </aside>

          <div className="space-y-5">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
              <Field label="Имя">
                <input disabled={!isOwnProfile} onChange={(event) => setFullName(event.target.value)} value={fullName} />
              </Field>
              <Field label="Телефон">
                <input disabled={!isOwnProfile} onChange={(event) => setPhone(event.target.value)} placeholder="+7..." value={phone} />
              </Field>
              <Field label="Дата рождения">
                <input disabled={!isOwnProfile} onChange={(event) => setBirthDate(event.target.value)} type="date" value={birthDate} />
              </Field>
              <Field label="Ссылка на аватар">
                <input disabled={!isOwnProfile} onChange={(event) => setAvatarUrl(event.target.value)} value={avatarUrl} />
              </Field>
              <label className="block text-sm font-medium sm:col-span-2">
                Личный статус
                <textarea
                  className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={!isOwnProfile}
                  onChange={(event) => setPersonalStatus(event.target.value)}
                  placeholder="Например: на объекте до 16:00, отвечаю с задержкой"
                  value={personalStatus}
                />
              </label>
              {error ? <p className="text-sm text-rose-600 sm:col-span-2">Ошибка: {error}</p> : null}
              {isOwnProfile ? (
                <button
                  className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-60 sm:col-span-2"
                  disabled={saving || !fullName.trim()}
                  type="submit"
                >
                  {saving ? 'Сохраняем...' : 'Сохранить профиль'}
                </button>
              ) : null}
            </form>

            {isOwnProfile ? (
              <section className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Контакты телефона</h3>
                    <p className="text-sm text-slate-500">
                      Импорт работает только в браузерах, где доступен Contact Picker API.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:opacity-60"
                    disabled={!contactPickerSupported || importing}
                    onClick={() => void importPhoneContacts()}
                    type="button"
                  >
                    {importing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Импортировать
                  </button>
                </div>
                {!contactPickerSupported ? (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    Этот браузер не дает сайту доступ к телефонной книге. На Android попробуйте Chrome и установленную PWA-версию.
                  </p>
                ) : null}
                <div className="mt-4 space-y-2">
                  {visibleContacts.length ? (
                    visibleContacts.map((contact) => (
                      <article className="rounded-lg bg-slate-50 p-3 text-sm" key={contact.id}>
                        <p className="font-medium">{contact.contact_name}</p>
                        <p className="text-slate-500">{contact.phone || contact.email || 'Без телефона и email'}</p>
                      </article>
                    ))
                  ) : (
                    <p className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                      <ContactRound className="h-4 w-4" />
                      Контактов пока нет.
                    </p>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: ReactElement }) => (
  <label className="block text-sm font-medium [&_input]:mt-2 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_input]:py-2 [&_input]:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-brand-500">
    {label}
    {children}
  </label>
);

const roleLabel = {
  owner: 'Владелец',
  admin: 'Администратор',
  manager: 'Руководитель отдела',
  employee: 'Сотрудник',
};
