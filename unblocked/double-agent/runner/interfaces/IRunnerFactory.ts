import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';

// Each assignment requires a fresh runner. The runner is created
// by a factory object implementing this interface.
export interface IRunnerFactory {
  // returns a unique identifier which uniquely identifies the kind/type of runners,
  // the factory spawns.
  runnerId(): string;

  // creation of resources and any other kind of preparative initialization/configuration
  // work is to be done within this function. If this method fails it is up to the
  // implementation to clean up the resources it already created in the process.
  // On the condition that this function did succeed it can be relied upon
  // that the factory user will call stopFactory under any circumstance.
  startFactory(): Promise<void>;

  // spawnRunner is the function used to create/spawn a new runner,
  // used for the assignment given to this function. It will be stopped
  // under any circumstance by the factory user when the assignment
  // finished successfully or got abruptly ended due to an error.
  spawnRunner(assignment: IAssignment): Promise<IRunner>;

  // stopFactory is to be used to clean up any resources created
  // in the lifetime of this factory object, starting since
  // the call of startFactory. This function will not be called in case
  // the construction of the factory or the call to startFactory threw an error,
  stopFactory(): Promise<void>;
}

// IRunner is the interface used for a runner which
// is to successfully complete any IAssignment thrown its way.
export interface IRunner {
  // run the assignment and return only when finished.
  run(assignment: IAssignment, filters?: IRunnerFilter): Promise<void>;

  // clean up any resources owned by the Runner implementation.
  stop(): Promise<void>;
}

export interface IRunnerFilter {
  onlyRunPluginIds: string[]
}
