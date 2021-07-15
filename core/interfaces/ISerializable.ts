import IPoint from '@ulixee/hero-interfaces/IPoint';

export type Serializable = number | string | boolean | null | Serializable[] | IJSONObject | IPoint;
export interface IJSONObject {
  [key: string]: Serializable;
}
