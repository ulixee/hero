import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { IInteractionGroup } from '@ulixee/hero-interfaces/IInteractions';
import { getKeyboardKey } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import { getNodePointerFnName } from '@ulixee/hero-interfaces/jsPathFnNames';
import TypeSerializer from '@ulixee/commons/TypeSerializer';
import ICommandWithResult from '../interfaces/ICommandWithResult';

export default class CommandFormatter {
  public static toString(command: ICommandMeta) {
    if (!command.args) {
      return `${command.name}()`;
    }
    const args = JSON.parse(command.args).filter(x => x !== null);
    if (command.name === 'execJsPath') {
      return formatJsPath(args[0]);
    }
    if (command.name === 'interact') {
      const interacts = args.map((x: IInteractionGroup) => {
        return x
          .map(y => {
            const extras: any = {};
            for (const [key, value] of Object.entries(y)) {
              if (
                key === 'mouseButton' ||
                key === 'keyboardDelayBetween' ||
                key === 'delayMillis'
              ) {
                extras[key] = value;
              }
            }
            let pathString = '';
            const path = y.mousePosition ?? y.delayElement ?? y.delayNode;
            if (path) {
              // mouse path
              if (path.length === 2 && typeof path[0] === 'number' && typeof path[1] === 'number') {
                pathString = path.join(',');
              } else {
                pathString = formatJsPath(path);
              }
            } else if (y.keyboardCommands) {
              pathString = y.keyboardCommands
                .map(keys => {
                  const [keyCommand] = Object.keys(keys);
                  if (keyCommand === 'string') return `"${keys[keyCommand]}"`;

                  const keyChar = getKeyboardKey(keys[keyCommand]);
                  if (keyCommand === 'keyPress') return `press: '${keyChar}'`;
                  if (keyCommand === 'up') return `up: '${keyChar}'`;
                  if (keyCommand === 'down') return `down: '${keyChar}'`;
                  return '';
                })
                .join(', ');
            }

            const extrasString = Object.keys(extras).length
              ? `, ${JSON.stringify(extras, null, 2)}`
              : '';
            return `${y.command}( ${pathString}${extrasString} )`;
          })
          .join(', ');
      });
      return interacts.join(';\n');
    }

    if (command.name === 'detachTab') {
      const { url } = args[0];
      return `detachTab(${url})`;
    }

    if (command.name === 'waitForElement') {
      return `waitForElement( ${formatJsPath(args[0])} )`;
    }

    return `${command.name}(${args.map(JSON.stringify).join(', ')})`;
  }

  public static parseResult(meta: ICommandMeta): ICommandWithResult {
    const duration = meta.endDate
      ? new Date(meta.endDate).getTime() -
        new Date(meta.clientStartDate ?? meta.runStartDate).getTime()
      : null;

    const command: ICommandWithResult = {
      ...meta,
      label: CommandFormatter.toString(meta),
      duration,
      startDate: meta.clientStartDate ?? meta.runStartDate,
      isError: false,
      result: undefined,
    };

    if (meta.result && meta.name === 'takeScreenshot') {
      const result = JSON.parse(meta.result);
      const imageType = command.label.includes('jpeg') ? 'jpeg' : 'png';
      const base64 = result.__type === 'Buffer64' ? result.value : result.data;
      command.result = `data:image/${imageType}; base64,${base64}`;
      command.resultType = 'image';
    } else if (meta.result && meta.resultType?.toLowerCase().includes('error')) {
      const result = TypeSerializer.parse(meta.result);

      command.isError = true;
      command.result = result.message;
      if (result.pathState) {
        const { step, index } = result.pathState;
        command.failedJsPathStepIndex = index;
        command.failedJsPathStep = Array.isArray(step)
          ? `${step[0]}(${step.slice(1).map(x => JSON.stringify(x))})`
          : step;
      }
    } else if (meta.resultType && meta.result) {
      const result = TypeSerializer.parse(meta.result);
      command.result = result;
      if (meta.resultType === 'Object' && result.value) {
        const resultType = typeof result.value;
        if (
          resultType === 'string' ||
          resultType === 'number' ||
          resultType === 'boolean' ||
          resultType === 'undefined'
        ) {
          command.result = result.value;
        }

        if (result.nodePointer) {
          command.resultNodeIds = [result.nodePointer.id];
          command.resultNodeType = result.nodePointer.type;
          if (result.nodePointer.iterableItems) {
            command.result = result.nodePointer.iterableItems;
          }
          if (result.nodePointer.iterableIsState) {
            command.resultNodeIds = result.nodePointer.iterableItems.map(x => x.id);
          }
        }
      }
    }

    if (!command.resultNodeIds && command.name === 'execJsPath') {
      const [jsPath] = JSON.parse(command.args);
      if (typeof jsPath[0] === 'number') command.resultNodeIds = [jsPath[0]];
    }

    if (!command.resultNodeIds && command.name === 'interact') {
      const args = JSON.parse(command.args);
      const mouseInteraction = args.find((x: IInteractionGroup) => {
        return x.length && x[0].mousePosition && x[0].mousePosition.length === 1;
      });
      if (mouseInteraction) {
        command.resultNodeIds = mouseInteraction.mousePosition;
      }
    }

    if (command.result && command.name === 'detachTab') {
      command.result.prefetchedJsPaths = undefined;
    }

    if (command.result && command.name.startsWith('go')) {
      command.result = undefined;
    }

    // we have shell objects occasionally coming back. hide from ui
    if (meta.args?.includes(getNodePointerFnName)) {
      command.result = undefined;
    }
    return command;
  }
}

export function formatJsPath(path: any) {
  const jsPath = (path ?? [])
    .map((x, i) => {
      if (i === 0 && typeof x === 'number') {
        return `getNodeById(${x})`;
      }
      if (Array.isArray(x)) {
        if (x[0] === getNodePointerFnName) return;
        return `${x[0]}(${x.slice(1).map(y => JSON.stringify(y))})`;
      }
      return x;
    })
    .filter(Boolean);

  if (!jsPath.length) return `${path.map(JSON.stringify)}`;

  return `${jsPath.join('.')}`;
}
