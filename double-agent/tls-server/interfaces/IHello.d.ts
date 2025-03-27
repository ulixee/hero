export default interface IHello {
    type: string;
    version: string;
    random: {
        unixTime: string;
        randomBytes: string;
    };
    sessionId: string;
    extensions: {
        type: string;
        decimal: number;
        values: string[];
    }[];
}
