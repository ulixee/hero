export enum InternalLocations {
  Dashboard = 'Dashboard',
  Settings = 'Settings',
  History = 'History',
}

type IWindowLocation = keyof typeof InternalLocations;

export default IWindowLocation;
