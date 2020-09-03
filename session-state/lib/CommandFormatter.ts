import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import { IInteractionGroup } from '@secret-agent/core-interfaces/IInteractions';
import { getKeyboardKey } from '@secret-agent/core-interfaces/IKeyboardLayoutUS';
import getAttachedStateFnName from '@secret-agent/core-interfaces/getAttachedStateFnName';
import ICommandWithResult from '../interfaces/ICommandWithResult';

export default class CommandFormatter {
  public static toString(command: ICommandMeta) {
    if (!command.args) {
      return `${command.name}()`;
    }
    const args = JSON.parse(command.args);
    if (command.name === 'execJsPath') {
      return formatJsPath(args[0]);
    }
    if (command.name === 'interact') {
      const interacts = args[0].map((x: IInteractionGroup) => {
        return x
          .map(y => {
            const extras: any = {};
            for (const [key, value] of Object.entries(y)) {
              if (
                key === 'mouseSteps' ||
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
    if (command.name === 'waitForElement') {
      return `waitForElement( ${formatJsPath(args[0])} )`;
    }

    return `${command.name}(${args.map(JSON.stringify)})`;
  }

  public static parseResult(meta: ICommandMeta) {
    const duration = meta.endDate
      ? new Date(meta.endDate).getTime() - new Date(meta.startDate).getTime()
      : null;

    const command: ICommandWithResult = {
      ...meta,
      label: CommandFormatter.toString(meta),
      duration,
      isError: false,
      result: undefined,
    };

    if (meta.resultType && meta.result) {
      const result = JSON.parse(meta.result);
      command.result = result;
      if (meta.resultType === 'Object') {
        const resultType = typeof result.value;
        if (
          resultType === 'string' ||
          resultType === 'number' ||
          resultType === 'boolean' ||
          resultType === 'undefined'
        ) {
          command.result = result.value;
        }

        if (result.attachedState) {
          command.resultNodeIds = [result.attachedState.id];
          command.resultNodeType = result.attachedState.type;
          if (result.attachedState.iterableItems) {
            command.result = result.attachedState.iterableItems;
          }
          if (result.attachedState.iterableIds) {
            command.resultNodeIds = result.attachedState.iterableIds;
          }
        }
      }

      if (meta.resultType.toLowerCase().includes('error')) {
        command.isError = true;
        command.result = result.message;
        if (result.pathState) {
          const { step, index } = result.pathState;
          command.failedJsPathStepIndex = index;
          command.failedJsPathStep = Array.isArray(step)
            ? `${step[0]}(${step.slice(1).map(x => JSON.stringify(x))})`
            : step;
        }
      }
    }

    // we have shell objects occasionally coming back. hide from ui
    if (meta.args?.includes(getAttachedStateFnName)) {
      command.result = undefined;
    }
    return command;
  }
}

function formatJsPath(path: any) {
  const jsPath = path
    .map((x, i) => {
      if (i === 0 && typeof x === 'number') {
        return 'prev';
      }
      if (Array.isArray(x)) {
        if (x[0] === getAttachedStateFnName) return;
        return `${x[0]}(${x.slice(1).map(y => JSON.stringify(y))})`;
      }
      return x;
    })
    .filter(Boolean);

  if (!jsPath.length) return `${path.map(JSON.stringify)}`;

  return `${jsPath.join('.')}`;
}
