export enum InternalLocations {
  Home = 'Home',
  Settings = 'Settings',
  History = 'History',
  Replay = 'Replay',
  NewTab = 'NewTab',
}

type ITabLocation = keyof typeof InternalLocations;

export default ITabLocation;
