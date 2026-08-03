import { ptBR } from './locales/pt-BR';
import { enUS } from './locales/en-US';
import type { NextRequest } from 'next/server';

export type Locale = 'pt-BR' | 'en-US';

export type Dictionary = {
  readonly login: {
    readonly title: string;
    readonly subtitle: string;
    readonly email: string;
    readonly emailPlaceholder: string;
    readonly password: string;
    readonly passwordPlaceholder: string;
    readonly submit: string;
    readonly submitting: string;
    readonly errorFallback: string;
  };
  readonly dashboard: {
    readonly title: string;
  };
  readonly navbar: {
    readonly logout: string;
    readonly loggingOut: string;
  };
  readonly sidebar: {
    readonly dashboard: string;
    readonly students: string;
    readonly employees: string;
  };
  readonly students: {
    readonly title: string;
    readonly newButton: string;
    readonly searchPlaceholder: string;
    readonly statusAll: string;
    readonly statusActive: string;
    readonly statusInactive: string;
    readonly columnName: string;
    readonly columnGuardian: string;
    readonly columnStatus: string;
    readonly columnActions: string;
    readonly editAction: string;
    readonly activateAction: string;
    readonly deactivateAction: string;
    readonly toggleStatusErrorFallback: string;
    readonly emptyState: string;
    readonly previous: string;
    readonly next: string;
    readonly page: string;
    readonly itemsPerPage: string;

    readonly formTitleNew: string;
    readonly formTitleEdit: string;
    readonly tabData: string;
    readonly tabGuardian: string;
    readonly tabAuthorizedPickups: string;
    readonly tabAuthorizedPickupsDisabled: string;

    readonly fieldName: string;
    readonly fieldNamePlaceholder: string;
    readonly fieldBirthDate: string;
    readonly fieldPhotoUrl: string;
    readonly fieldPhotoUrlPlaceholder: string;
    readonly fieldStatus: string;

    readonly guardianModeExisting: string;
    readonly guardianModeNew: string;
    readonly guardianSearchLabel: string;
    readonly guardianSearchPlaceholder: string;
    readonly guardianSearchNoResults: string;
    readonly guardianSelectedLabel: string;
    readonly guardianChangeButton: string;
    readonly fieldGuardianName: string;
    readonly fieldCpf: string;
    readonly fieldCpfPlaceholder: string;
    readonly fieldPhone: string;
    readonly fieldPhonePlaceholder: string;
    readonly fieldEmail: string;
    readonly fieldEmailPlaceholder: string;

    readonly authorizedPickupsEmpty: string;
    readonly authorizedPickupsAddButton: string;
    readonly authorizedPickupsRemoveButton: string;
    readonly fieldRelationship: string;
    readonly fieldRelationshipPlaceholder: string;

    readonly submit: string;
    readonly submitting: string;
    readonly cancel: string;

    readonly errorNameRequired: string;
    readonly errorBirthDateRequired: string;
    readonly errorCpfInvalid: string;
    readonly errorEmailInvalid: string;
    readonly errorPhoneInvalid: string;
    readonly errorGuardianRequired: string;
    readonly errorGuardianNameRequired: string;
    readonly errorRelationshipRequired: string;

    readonly createSuccess: string;
    readonly updateSuccess: string;
    readonly errorFallback: string;
    readonly authorizedPickupAddSuccess: string;
    readonly authorizedPickupUpdateSuccess: string;
    readonly authorizedPickupRemoveSuccess: string;
    readonly authorizedPickupErrorFallback: string;
  };
  readonly employees: {
    readonly title: string;
    readonly newButton: string;
    readonly searchPlaceholder: string;
    readonly statusAll: string;
    readonly statusActive: string;
    readonly statusInactive: string;
    readonly columnName: string;
    readonly columnPosition: string;
    readonly columnStatus: string;
    readonly columnActions: string;
    readonly editAction: string;
    readonly activateAction: string;
    readonly deactivateAction: string;
    readonly toggleStatusErrorFallback: string;
    readonly emptyState: string;
    readonly previous: string;
    readonly next: string;
    readonly page: string;
    readonly itemsPerPage: string;

    readonly formTitleNew: string;
    readonly formTitleEdit: string;

    readonly fieldName: string;
    readonly fieldNamePlaceholder: string;
    readonly fieldPosition: string;
    readonly fieldPositionPlaceholder: string;
    readonly fieldCpf: string;
    readonly fieldCpfPlaceholder: string;
    readonly fieldPhone: string;
    readonly fieldPhonePlaceholder: string;
    readonly fieldEmail: string;
    readonly fieldEmailPlaceholder: string;
    readonly fieldStatus: string;

    readonly submit: string;
    readonly submitting: string;
    readonly cancel: string;

    readonly errorNameRequired: string;
    readonly errorPositionRequired: string;
    readonly errorCpfInvalid: string;
    readonly errorEmailInvalid: string;
    readonly errorPhoneInvalid: string;

    readonly createSuccess: string;
    readonly updateSuccess: string;
    readonly errorFallback: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

export const DEFAULT_LOCALE: Locale = 'pt-BR';
export const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en-US'];
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/** Resolves locale from request: cookie → Accept-Language header → default */
export function getLocaleFromRequest(req: NextRequest): Locale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (cookie && SUPPORTED_LOCALES.includes(cookie)) return cookie;

  const acceptLanguage = req.headers.get('accept-language') ?? '';
  const browserLocale = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim())
    .find((lang) => SUPPORTED_LOCALES.includes(lang as Locale)) as Locale | undefined;

  if (browserLocale) return browserLocale;

  return DEFAULT_LOCALE;
}
