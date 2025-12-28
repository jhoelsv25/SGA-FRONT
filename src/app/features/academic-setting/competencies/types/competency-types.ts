export interface Competency {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly expectedAchievement: string;
  readonly active: boolean;
  readonly course: { id: string; name: string };
}
