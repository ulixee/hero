import { remote } from 'electron';

export const closeWindow = () => {
  remote.getCurrentWindow().close();
};
