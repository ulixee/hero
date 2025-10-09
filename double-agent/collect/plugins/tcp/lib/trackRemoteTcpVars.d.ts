export default function trackRemoteTcpVars(serverPort: string | number): {
    hasError: any;
    getPacket: (addr: string) => Promise<{
        windowSize: number;
        ttl: number;
    }>;
    stop: () => any;
};
