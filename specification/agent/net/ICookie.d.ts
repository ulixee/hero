export interface ICookie {
    name: string;
    value: string;
    domain?: string;
    url?: string;
    path?: string;
    expires?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameParty?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}
