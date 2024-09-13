import PageNames from '../interfaces/PageNames';
import DomExtractor = require('../injected-scripts/DomExtractor');

export default function loadDomExtractorScript(): string {
  return DomExtractor.toString();
}

export interface IDomExtractorPageMeta {
  saveToUrl: string;
  pageUrl: string;
  pageHost: string;
  pageName: keyof typeof PageNames | string;
}
