export type Serializable = number | string | boolean | null | Serializable[] | IJSONObject;
export interface IJSONObject {
  [key: string]: Serializable;
}
