export interface ICookie {
  name: string;
  value: string;
  domain?: string;
  url?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  session?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}
