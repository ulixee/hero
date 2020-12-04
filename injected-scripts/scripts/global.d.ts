interface ITson {
  stringify(object: any): string;
  parse(object: string): any;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let TSON: ITson;
