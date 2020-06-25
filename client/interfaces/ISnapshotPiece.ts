import puppeteer from 'puppeteer';

export default interface ISnapshotPiece {
  cookies: puppeteer.Cookie[];
  body: string;
}
