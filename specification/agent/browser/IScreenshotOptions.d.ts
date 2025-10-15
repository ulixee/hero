import IRect from './IRect';
export default interface IScreenshotOptions {
    format?: 'jpeg' | 'png';
    rectangle?: IRect & {
        scale: number;
    };
    jpegQuality?: number;
    fullPage?: boolean;
}
