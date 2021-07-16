import { IOutputChange } from '~shared/interfaces/IHeroSession';

interface IOutputAtCommand {
  output: any;
  bytes: number;
  changes: { type: string; path: string }[];
}
export default class ReplayOutput {
  private changesByCommandId = new Map<number, IOutputAtCommand>();

  public getLatestOutput(commandId: number): IOutputAtCommand {
    for (let id = commandId; id >= 0; id -= 1) {
      if (this.changesByCommandId.has(id)) {
        return this.changesByCommandId.get(id);
      }
    }
  }

  public onOutput(changes: IOutputChange[]): void {
    for (const output of changes) {
      const path = JSON.parse(output.path) as PropertyKey[];

      let prevCommandId = output.lastCommandId;
      while (prevCommandId >= 0) {
        if (this.changesByCommandId.has(prevCommandId)) {
          break;
        }
        prevCommandId -= 1;
      }

      let startOutput = this.changesByCommandId.get(prevCommandId)?.output;

      if (!startOutput) {
        if (typeof path[0] === 'number') startOutput = [];
        else startOutput = {};
      } else if (Array.isArray(startOutput)) {
        startOutput = [...startOutput];
      } else {
        startOutput = { ...startOutput };
      }

      if (!this.changesByCommandId.has(output.lastCommandId)) {
        this.changesByCommandId.set(output.lastCommandId, { output: null, changes: [], bytes: 0 });
      }
      const changeEntry = this.changesByCommandId.get(output.lastCommandId);
      changeEntry.output = startOutput;

      let propertyOwner = startOutput;
      const property = path.pop();
      // re-build objects up to the last entry so we don't modify previous entries
      for (const entry of path) {
        const existing = propertyOwner[entry];
        if (existing && typeof existing === 'object') {
          if (Array.isArray(existing)) propertyOwner[entry] = [...existing];
          else propertyOwner[entry] = { ...existing };
        }
        propertyOwner = propertyOwner[entry];
      }

      if (output.type === 'delete') {
        if (Array.isArray(propertyOwner)) {
          propertyOwner.splice(property as number, 1);
        } else {
          delete propertyOwner[property];
        }
      } else if (output.type === 'reorder') {
        const order = JSON.parse(output.value) as number[];
        if (property) {
          const startArray = propertyOwner[property];
          propertyOwner[property] = order.map(x => startArray[x]);
        } else {
          changeEntry.output = order.map(x => startOutput[x]);
        }
      } else {
        propertyOwner[property] = JSON.parse(output.value);
      }

      let flatPath = '';
      for (const part of path.concat([property])) {
        if (typeof part === 'number') {
          flatPath += `[${part}]`;
        } else if (typeof part === 'string' && part.includes('.')) {
          flatPath += `["${part}"]`;
        } else {
          flatPath += `.${part as string}`;
        }
      }
      changeEntry.changes.push({ path: flatPath, type: output.type });
      changeEntry.bytes = Buffer.byteLength(JSON.stringify(changeEntry.output));
    }
  }
}
