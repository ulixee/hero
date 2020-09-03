export interface ICookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
  size: number;
  httpOnly: boolean;
  session: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}
