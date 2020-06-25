export default interface IContextValidate {
  isPresent: (...keys: string[]) => void;
  hasValue: (key: string, values: string[]) => void;
}
