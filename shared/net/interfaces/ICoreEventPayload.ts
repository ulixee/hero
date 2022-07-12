export default interface ICoreEventPayload<Spec, T extends keyof Spec> {
  eventType: T;
  listenerId?: string;
  data: Spec[T];
}
