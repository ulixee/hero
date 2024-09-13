export default interface IConnectionTransport {
  isClosed: boolean;
  onMessageFn: (message: string) => void;
  onCloseFns: (() => void)[];
  send(body: string): boolean;
  close();
}
