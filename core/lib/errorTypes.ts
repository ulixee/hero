import { registerSerializableErrorType } from '@ulixee/commons/lib/TypeSerializer';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import SourceLoader from '@ulixee/commons/lib/SourceLoader';

export class ScriptChangedNeedsRestartError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ScriptChangedNeedsRestartError';
    this.stack = `${this.name}: ${this.message}`;
  }

  public static atCommand(command: ICommandMeta): ScriptChangedNeedsRestartError {
    let scriptLocation = '';
    if (command.callsite) {
      const source = SourceLoader.getSource(command.callsite[0]);
      if (source?.code) scriptLocation = `\n\n>> script is changed at line #${source.line}. "${source.code.trim()}\n\n\n"`;
    }
    const message = `Your script has changed. ${scriptLocation}To resume this session, your script needs to be restarted from the start.`;
    return new ScriptChangedNeedsRestartError(message);
  }
}

registerSerializableErrorType(ScriptChangedNeedsRestartError);
