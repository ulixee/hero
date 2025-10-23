export declare const CertsMessage: string;
export declare function checkSetup(): void;
export default function certs(): ICert;
export declare function tlsCerts(): ICert;
interface ICert {
    key: Buffer;
    cert: Buffer;
}
export {};
