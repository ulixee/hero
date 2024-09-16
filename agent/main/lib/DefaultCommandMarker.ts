import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import BrowserContext from './BrowserContext';
import ICommandMarker from '../interfaces/ICommandMarker';

interface IMarker {
  id: number;
  action: string;
}

export class DefaultCommandMarker implements ICommandMarker {
  public get lastId(): number {
    return this.commandMarkerId;
  }

  public get last(): IMarker {
    return this.markers[this.markers.length - 1];
  }

  public markers: IMarker[] = [];

  private commandMarkerId = 0;
  private waitForLocationStartingMark = 0;
  private logger: IBoundLog;

  constructor(readonly browserContext: BrowserContext) {
    this.logger = browserContext.logger.createChild(module);
  }

  incrementMark(action: string): void {
    this.commandMarkerId += 1;

    // handle cases like waitForLocation two times in a row
    if (!action.startsWith('waitFor') || action === 'waitForLocation') {
      if (this.last?.action.startsWith('waitFor')) {
        this.waitForLocationStartingMark = this.commandMarkerId;
      }
    }
    if (action === 'goto') {
      this.waitForLocationStartingMark = this.commandMarkerId;
    }
    this.markers.push({ action, id: this.commandMarkerId });
  }

  getStartingCommandIdFor(marker: 'waitForLocation'): number {
    if (marker === 'waitForLocation') {
      this.logger.info(`Starting Mark for ${marker}`, {
        startingMark: this.waitForLocationStartingMark,
        markers: this.markers,
      });
      return this.waitForLocationStartingMark;
    }
    return 0;
  }
}
