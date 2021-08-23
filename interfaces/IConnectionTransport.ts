export default interface IConnectionTransport {
  onMessageFn: (message: string) => void;
  onCloseFns: (() => void)[];
  send(body: string);
  close();
}
