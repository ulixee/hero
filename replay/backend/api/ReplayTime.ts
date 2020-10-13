export default class ReplayTime {
  public millis = 0;
  public start: Date;
  public close?: Date;

  constructor(start: Date, close?: Date) {
    this.start = start;
    this.close = close;
    this.update(close);
  }

  public update(close?: Date) {
    this.close = close;
    const start = this.start;
    if (close) {
      this.millis = close.getTime() - start.getTime();
    } else {
      // add 10 seconds to end time
      this.millis = (new Date().getTime() - start.getTime()) * 1.25;
    }
  }
}
