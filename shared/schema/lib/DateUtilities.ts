import assert = require('assert');
import moment = require('moment');

const Units = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'] as const;
export type IUnits = 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years';

interface IDateFunction {
  func: 'add' | 'subtract';
  quantity: number;
  units: IUnits;
}

export class DateUtilities implements IDateFunction {
  func: 'add' | 'subtract';
  quantity: number;
  units: IUnits;

  constructor(config: IDateFunction) {
    Object.assign(this, config);
    assert(config.func === 'add' || config.func === 'subtract', 'func must be add or subtract');
    assert(typeof config.quantity === 'number', 'quantity must be a number');
    assert(Units.includes(config.units as any), `units must be one of ${Units.join(',')}`);
  }

  public evaluate(format: 'date' | 'time'): string;
  public evaluate(): Date;
  public evaluate(format?: 'date' | 'time'): Date | string {
    let result: moment.Moment;
    if (this.func === 'add') {
      result = moment().add(this.quantity, this.units as any);
    }
    if (this.func === 'subtract') {
      result = moment().subtract(this.quantity, this.units as any);
    }
    if (format === 'date') return result.format('YYYY-MM-DD');
    if (format === 'time') return result.format('HH:mm');
    return result.toDate();
  }
}
