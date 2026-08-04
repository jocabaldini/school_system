export interface Settings {
  id: string;
  pricePerHour: string;
  defaultSchoolDays: number;
  latePenaltyPercentage: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  pricePerHour?: number;
  defaultSchoolDays?: number;
  latePenaltyPercentage?: number;
}
