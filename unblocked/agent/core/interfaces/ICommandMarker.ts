export default interface ICommandMarker {
  readonly lastId: number;
  incrementMark?(action: string): void;
  getStartingCommandIdFor(marker: 'waitForLocation'): number;
}
