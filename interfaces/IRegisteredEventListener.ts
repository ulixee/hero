import { EventEmitter } from "events";
import ITypedEventEmitter from "./ITypedEventEmitter";

export default interface IRegisteredEventListener {
  emitter: EventEmitter | ITypedEventEmitter<any>;
  eventName: string | symbol;
  handler: (...args: any[]) => void;
}
