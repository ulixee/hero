export default interface IWebRTCCodec {
    clockRate: number;
    mimeType: string;
    channels?: number;
    sdpFmtpLine?: string;
}
