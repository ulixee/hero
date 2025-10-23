import * as http2 from 'http2';
export default interface IHttp2ConnectSettings {
    settings: http2.Settings;
    localWindowSize: number;
}
