export default interface ISessionReplayServer {
  port: number;
  url: string;
  close: (waitForOpenConnections: boolean) => Promise<void>;
}
