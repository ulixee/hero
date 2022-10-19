export type IValidationError = {
  path: string;
  code: 'invalidType' | 'constraintFailed' | 'missing';
  message: string;
};

export default interface IValidationResult {
  success: boolean;
  errors: IValidationError[];
}
