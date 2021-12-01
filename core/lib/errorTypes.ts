import { registerSerializableErrorType } from '@ulixee/commons/lib/TypeSerializer';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';

export class ScriptChangedNeedsRestartError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ScriptChangedNeedsRestartError';
    this.stack = `${this.name}: ${this.message}`;
  }

  public static atCommand(command: ICommandMeta): ScriptChangedNeedsRestartError {
    const message = `Your script has changed. 
    
  >> script is changed at: "${command.callsite}"
    
To resume this session, your script needs to be restarted from the start.`;
    return new ScriptChangedNeedsRestartError(message);
  }
}

registerSerializableErrorType(ScriptChangedNeedsRestartError);
