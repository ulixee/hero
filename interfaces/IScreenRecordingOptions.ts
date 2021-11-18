export default interface IScreenRecordingOptions {
  format?: 'jpeg' | 'png';
  jpegQuality?: number;
  imageSize?: { width?: number; height?: number };
}
