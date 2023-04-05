export default function addGlobalInstance(...constructors: Function[]): void {
  for (const constructor of constructors) {
    if (!constructor.prototype) continue;
    const instanceSymbol = Symbol.for(`@ulixee/${constructor.name}`);
    if (constructor.prototype[instanceSymbol] === true) continue;

    constructor.prototype[instanceSymbol] = true;

    Object.defineProperty(constructor, Symbol.hasInstance, {
      value: function hasInstance(candidate): boolean {
        return this === constructor && !!candidate[instanceSymbol];
      },
    });
  }
}
