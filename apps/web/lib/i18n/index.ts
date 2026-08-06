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
    readonly metricActiveStudents: string;
    readonly metricActiveEmployees: string;
    readonly metricClasses: string;
    readonly metricActiveEnrollments: string;
    readonly occupancyTitle: string;
    readonly occupancyEmpty: string;
    readonly recentEnrollmentsTitle: string;
    readonly recentEnrollmentsEmpty: string;
    readonly columnStudent: string;
    readonly columnClass: string;
    readonly columnStartDate: string;
  };
  readonly navbar: {
    readonly logout: string;
    readonly loggingOut: string;
  };
  readonly sidebar: {
    readonly dashboard: string;
    readonly students: string;
    readonly employees: string;
    readonly schoolClasses: string;
    readonly settings: string;
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
    readonly columnSchoolClass: string;
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
    readonly tabEnrollment: string;
    readonly tabEnrollmentDisabled: string;

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

    readonly errorFallback: string;
    readonly authorizedPickupAddSuccess: string;
    readonly authorizedPickupUpdateSuccess: string;
    readonly authorizedPickupRemoveSuccess: string;
    readonly authorizedPickupErrorFallback: string;

    readonly currentEnrollmentLabel: string;
    readonly enrollButton: string;
    readonly transferButton: string;
    readonly fieldSchoolClass: string;
    readonly fieldSchoolClassPlaceholder: string;
    readonly fieldFullTime: string;
    readonly fieldStartTime: string;
    readonly fieldEndTime: string;
    readonly fieldBreakStart: string;
    readonly fieldBreakEnd: string;
    readonly fieldStartDate: string;
    readonly fieldDiscountPercentage: string;
    readonly fieldTuitionAmount: string;
    readonly suggestedAmountLabel: string;
    readonly useSuggestedAmountButton: string;
    readonly errorSchoolClassRequired: string;
    readonly errorStartTimeRequired: string;
    readonly errorEndTimeRequired: string;
    readonly errorTuitionAmountRequired: string;
    readonly enrollSuccess: string;
    readonly transferSuccess: string;
    readonly enrollmentErrorFallback: string;
    readonly enrollmentHistoryTitle: string;
    readonly enrollmentHistoryEmpty: string;
    readonly columnClass: string;
    readonly columnPeriod: string;
    readonly columnAmount: string;
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

    readonly errorFallback: string;
  };
  readonly schoolClasses: {
    readonly title: string;
    readonly newButton: string;
    readonly searchPlaceholder: string;
    readonly schoolYearFilterPlaceholder: string;
    readonly statusAll: string;
    readonly statusActive: string;
    readonly statusInactive: string;
    readonly columnName: string;
    readonly columnSchoolYear: string;
    readonly columnTeacher: string;
    readonly columnAssistant: string;
    readonly columnOccupancy: string;
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
    readonly tabStudents: string;
    readonly tabStudentsDisabled: string;
    readonly columnStudentName: string;
    readonly columnSchedule: string;
    readonly columnStudentStartDate: string;
    readonly studentsEmpty: string;

    readonly fieldName: string;
    readonly fieldNamePlaceholder: string;
    readonly fieldSchoolYear: string;
    readonly fieldMaxCapacity: string;
    readonly fieldMaxCapacityPlaceholder: string;
    readonly fieldTeacher: string;
    readonly fieldTeacherPlaceholder: string;
    readonly fieldAssistant: string;
    readonly fieldAssistantPlaceholder: string;
    readonly fieldStatus: string;

    readonly submit: string;
    readonly submitting: string;
    readonly cancel: string;

    readonly errorNameRequired: string;
    readonly errorSchoolYearRequired: string;
    readonly errorMaxCapacityRequired: string;
    readonly errorTeacherRequired: string;

    readonly errorFallback: string;
  };
  readonly settings: {
    readonly title: string;
    readonly fieldPricePerHour: string;
    readonly fieldPricePerHourPlaceholder: string;
    readonly fieldDefaultSchoolDays: string;
    readonly fieldDefaultSchoolDaysPlaceholder: string;
    readonly fieldLatePenaltyPercentage: string;
    readonly fieldLatePenaltyPercentagePlaceholder: string;
    readonly submit: string;
    readonly submitting: string;
    readonly errorFieldsRequired: string;
    readonly saveSuccess: string;
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
