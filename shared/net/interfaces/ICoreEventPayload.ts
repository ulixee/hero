export default interface ICoreEventPayload<Spec, T extends keyof Spec = keyof Spec> {
  eventType: T;
  listenerId?: string;
  data: Spec[T];
}
