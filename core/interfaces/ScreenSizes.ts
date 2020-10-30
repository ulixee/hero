interface IScreenSize {
  width: number;
  height: number;
  percent: number;
}

// extracted from https://www.w3schools.com/browsers/browsers_display.asp
const ScreenSizes: IScreenSize[] = [
  { width: 1920, height: 1080, percent: 20.3 },
  { width: 1366, height: 768, percent: 27.6 },
  { width: 1536, height: 864, percent: 9.8 },
  { width: 1440, height: 900, percent: 5.6 },
  { width: 1600, height: 900, percent: 4.1 },
  { width: 1280, height: 720, percent: 3.9 },
  { width: 1680, height: 1050, percent: 2.6 },
  { width: 1280, height: 1024, percent: 2.4 },
  { width: 1280, height: 800, percent: 1.8 },
  { width: 2560, height: 1440, percent: 1.7 },
  { width: 1920, height: 1200, percent: 1.5 },
  { width: 1360, height: 768, percent: 1 },
  { width: 1024, height: 768, percent: 0.14 },
];
