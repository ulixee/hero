type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
};

type FilterOutFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? never : Key;
};

type OnlyProperties<Base> = FilterOutFlags<Base, (...args: any[]) => any>[keyof Base];
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];

export { FilterFlags, AllowedNames, OnlyProperties };
