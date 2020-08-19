export default interface ISessionReplayServer {
  port: number;
  url: string;
  hasClients: () => boolean;
  close: (waitForOpenConnections: boolean) => Promise<void>;
}
