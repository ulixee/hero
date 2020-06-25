import BaseDb from './BaseDb';

const defaultWindowState = {};

export default class ConfigsDb extends BaseDb<IWindowState> {
  constructor() {
    super('WindowState', { ...defaultWindowState });
  }

  public fetch() {
    return { ...this.allData };
  }

  public update(newData: IWindowState) {
    Object.assign(this.allData, newData);
  }
}

export interface IWindowState {
  isMaximized?: boolean;
  isFullscreen?: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
