import IPoint from '@ulixee/hero-interfaces/IPoint';
import curveLength from './curveLength';

// class extract from https://github.com/Pomax/bezierjs

export default class Bezier {
  private readonly points: IPoint[];
  private readonly derivativePoints: IPoint[][];
  constructor(...points: IPoint[]) {
    this.points = points;
    this.derivativePoints = [];

    let prev = points;
    for (let i = points.length; i > 1; i -= 1) {
      const list: IPoint[] = [];
      const c = i - 1;

      for (let j = 0; j < c; j += 1) {
        list.push({
          x: c * (prev[j + 1].x - prev[j].x),
          y: c * (prev[j + 1].y - prev[j].y),
        });
      }

      this.derivativePoints.push(list);
      prev = list;
    }
  }

  toString(): string {
    const points = this.points.map(p => `${p.x}/${p.y}`).join(', ');
    return `[${points}]`;
  }

  length() {
    return curveLength(t => Bezier.compute(t, this.derivativePoints[0]));
  }

  getLookupTable(points = 100): IPoint[] {
    if (Number.isNaN(points)) points = 100;

    const table: IPointWithT[] = [];
    for (let i = 0; i <= points; i += 1) {
      let t = i;
      if (i > 0) t = i / points;
      const p = Bezier.compute(t, this.points);
      p.t = t;

      table.push(p);
    }

    return table;
  }

  static compute(t: number, points: IPointWithT[]): IPointWithT {
    // shortcuts
    if (t === 0) {
      points[0].t = 0;
      return points[0];
    }

    const order = points.length - 1;

    if (t === 1) {
      points[order].t = 1;
      return points[order];
    }

    const mt = 1 - t;

    if (order === 0) {
      points[0].t = t;
      return points[0];
    } // linear?

    if (order === 1) {
      return {
        x: mt * points[0].x + t * points[1].x,
        y: mt * points[0].y + t * points[1].y,
        t,
      };
    } // quadratic/cubic curve?

    if (order < 4) {
      const mt2 = mt * mt;
      const t2 = t * t;
      let a: number;
      let b: number;
      let c: number;
      let d = 0;

      if (order === 2) {
        points = [
          points[0],
          points[1],
          points[2],
          {
            x: 0,
            y: 0,
          },
        ];
        a = mt2;
        b = mt * t * 2;
        c = t2;
      } else if (order === 3) {
        a = mt2 * mt;
        b = mt2 * t * 3;
        c = mt * t2 * 3;
        d = t * t2;
      }

      return {
        x: a * points[0].x + b * points[1].x + c * points[2].x + d * points[3].x,
        y: a * points[0].y + b * points[1].y + c * points[2].y + d * points[3].y,
        t,
      };
    } // higher order curves: use de Casteljau's computation

    // copy list
    const dCpts = points.map(x => {
      return { ...x };
    });

    while (dCpts.length > 1) {
      for (let i = 0; i < dCpts.length - 1; i += 1) {
        dCpts[i] = {
          x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
          y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t,
        };
      }

      dCpts.splice(dCpts.length - 1, 1);
    }

    dCpts[0].t = t;
    return dCpts[0];
  }
}

interface IPointWithT extends IPoint {
  t?: number;
}
