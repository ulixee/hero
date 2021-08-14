import EventEmitter = NodeJS.EventEmitter;

export default interface ICommandCounter {
  nextCommandId: number;
  lastCommandId: number;
  emitter: EventEmitter;
}
