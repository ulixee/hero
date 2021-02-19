export class DependenciesMissingError extends Error {
  constructor(
    resolutionMessage: string,
    readonly engineName: string,
    readonly missingDependencies: string[],
  ) {
    super(
      `Some of the dependencies needed to run ${engineName} are not on your system!\n\n${resolutionMessage}`,
    );
    this.name = 'DependenciesMissingError';
  }
}
