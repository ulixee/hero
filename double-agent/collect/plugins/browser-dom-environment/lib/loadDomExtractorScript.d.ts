import PageNames from '../interfaces/PageNames';
export default function loadDomExtractorScript(): string;
export interface IDomExtractorPageMeta {
    saveToUrl: string;
    pageUrl: string;
    pageHost: string;
    pageName: keyof typeof PageNames | string;
    debugToConsole?: boolean;
    stallLogUrl?: string;
}
