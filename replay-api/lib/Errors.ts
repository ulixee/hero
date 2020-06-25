export class UserError extends Error {
  public type: string;
  constructor(public title: string, public extra: any = {}) {
    super(title);
    Object.setPrototypeOf(this, new.target.prototype); // restores prototype chain
    this.type = this.constructor.name;
  }
}

export class MissingRecord extends UserError {}

export class CustomError extends UserError {
  constructor(type: string, title: string, extra?: any) {
    super(title, extra);
    this.type = type;
  }
}
