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
    readonly alunos: string;
    readonly funcionarios: string;
  };
  readonly alunos: {
    readonly title: string;
    readonly newButton: string;
    readonly searchPlaceholder: string;
    readonly statusAll: string;
    readonly statusActive: string;
    readonly statusInactive: string;
    readonly columnNome: string;
    readonly columnResponsavel: string;
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
    readonly tabDados: string;
    readonly tabResponsavel: string;
    readonly tabAutorizados: string;
    readonly tabAutorizadosDisabled: string;

    readonly fieldNome: string;
    readonly fieldNomePlaceholder: string;
    readonly fieldDataNascimento: string;
    readonly fieldFotoUrl: string;
    readonly fieldFotoUrlPlaceholder: string;
    readonly fieldStatus: string;

    readonly responsavelModeExisting: string;
    readonly responsavelModeNew: string;
    readonly responsavelSearchLabel: string;
    readonly responsavelSearchPlaceholder: string;
    readonly responsavelSearchNoResults: string;
    readonly responsavelSelectedLabel: string;
    readonly responsavelChangeButton: string;
    readonly fieldResponsavelNome: string;
    readonly fieldCpf: string;
    readonly fieldCpfPlaceholder: string;
    readonly fieldTelefone: string;
    readonly fieldTelefonePlaceholder: string;
    readonly fieldEmail: string;
    readonly fieldEmailPlaceholder: string;

    readonly autorizadosEmpty: string;
    readonly autorizadosAddButton: string;
    readonly autorizadosRemoveButton: string;
    readonly fieldParentesco: string;
    readonly fieldParentescoPlaceholder: string;

    readonly submit: string;
    readonly submitting: string;
    readonly cancel: string;

    readonly errorNomeRequired: string;
    readonly errorDataNascimentoRequired: string;
    readonly errorCpfInvalid: string;
    readonly errorEmailInvalid: string;
    readonly errorTelefoneInvalid: string;
    readonly errorResponsavelRequired: string;
    readonly errorResponsavelNomeRequired: string;
    readonly errorParentescoRequired: string;

    readonly createSuccess: string;
    readonly updateSuccess: string;
    readonly errorFallback: string;
    readonly autorizadoAddSuccess: string;
    readonly autorizadoUpdateSuccess: string;
    readonly autorizadoRemoveSuccess: string;
    readonly autorizadoErrorFallback: string;
  };
  readonly funcionarios: {
    readonly title: string;
    readonly newButton: string;
    readonly searchPlaceholder: string;
    readonly statusAll: string;
    readonly statusActive: string;
    readonly statusInactive: string;
    readonly columnNome: string;
    readonly columnCargo: string;
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

    readonly fieldNome: string;
    readonly fieldNomePlaceholder: string;
    readonly fieldCargo: string;
    readonly fieldCargoPlaceholder: string;
    readonly fieldCpf: string;
    readonly fieldCpfPlaceholder: string;
    readonly fieldTelefone: string;
    readonly fieldTelefonePlaceholder: string;
    readonly fieldEmail: string;
    readonly fieldEmailPlaceholder: string;
    readonly fieldStatus: string;

    readonly submit: string;
    readonly submitting: string;
    readonly cancel: string;

    readonly errorNomeRequired: string;
    readonly errorCargoRequired: string;
    readonly errorCpfInvalid: string;
    readonly errorEmailInvalid: string;
    readonly errorTelefoneInvalid: string;

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
