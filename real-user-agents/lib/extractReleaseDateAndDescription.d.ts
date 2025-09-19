import { IReleaseDates } from '../data';
export default function extractReleaseDateAndDescription(id: string, name: string, descriptions: {
    [key: string]: string;
}, releaseDates: IReleaseDates): [string, string];
