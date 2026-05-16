import IHeader from '../interfaces/IHeader';
interface IRecord {
    header: IHeader;
    details?: string;
}
export default function parseTlsRecordFromStderr(str: string): IRecord;
export {};
