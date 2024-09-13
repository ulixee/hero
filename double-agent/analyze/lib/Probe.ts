import * as Path from 'path';
import Config from '@double-agent/config';
import BaseCheck, { ICheckMeta, ICheckType } from './checks/BaseCheck';

const COUNTER_START = 18278;
const counterByPrefix: { [prefix: string]: number } = {};

export default class Probe {
  public id: string;
  public checkName: string;
  public checkType: ICheckType;
  public checkMeta: ICheckMeta;
  public args: any[];

  private readonly pluginId: string;
  private _check: BaseCheck;

  constructor(
    id: string,
    checkName: string,
    checkType: ICheckType,
    checkMeta: ICheckMeta,
    args: any[],
    pluginId: string,
  ) {
    this.id = id;
    this.checkName = checkName;
    this.checkType = checkType;
    this.checkMeta = checkMeta;
    this.args = args;
    this.pluginId = pluginId;
  }

  public get check(): BaseCheck {
    if (!this._check) {
      const checksDir = Path.resolve(__dirname, `checks`);
      const pluginChecksDir = Path.resolve(__dirname, `../plugins/${this.pluginId}/lib/checks`);
      let Check: any;
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        Check = require(`${pluginChecksDir}/${this.checkName}`).default;
      } catch (err) {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        Check = require(`${checksDir}/${this.checkName}`).default;
      }
      this._check = new Check({}, this.checkMeta, ...this.args);
    }
    return this._check;
  }

  public toJSON(): Pick<Probe, 'id' | 'checkName' | 'checkMeta' | 'checkType' | 'args'> {
    return {
      id: this.id,
      checkName: this.checkName,
      checkType: this.checkType,
      checkMeta: this.checkMeta,
      args: this.args,
    };
  }

  public static create(check: BaseCheck, pluginId: string): Probe {
    const id = generateId(check, pluginId);
    return new this(id, check.constructor.name, check.type, check.meta, check.args, pluginId);
  }

  public static load(probeObj: any, pluginId: string): Probe {
    const { id, checkName, checkType, checkMeta, args } = probeObj;
    return new this(id, checkName, checkType, checkMeta, args, pluginId);
  }
}

// HELPERS //////

function generateId(check: BaseCheck, pluginId: string): string {
  Config.probeIdsMap[pluginId] ??= {};
  let id = Config.probeIdsMap[pluginId][check.signature];
  if (!id) {
    counterByPrefix[check.prefix] ??= COUNTER_START;
    counterByPrefix[check.prefix] += 1;
    id = `${check.prefix}-${convertToAlpha(counterByPrefix[check.prefix])}`.toLowerCase();
  }
  Config.probeIdsMap[pluginId][check.signature] = id;
  return id;
}

function convertToAlpha(num): string {
  let t;
  let s = '';
  while (num > 0) {
    t = (num - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    num = ((num - t) / 26) | 0;
  }
  if (!s) {
    throw new Error(`Integer could not be converted: ${num}`);
  }
  return s;
}
