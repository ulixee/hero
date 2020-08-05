export enum InternalLocations {
  Home = 'Home',
  Settings = 'Settings',
  History = 'History',
  NewTab = 'NewTab',
}

type ITabLocation = keyof typeof InternalLocations;

export default ITabLocation;
