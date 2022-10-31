import Queue from 'p-queue';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import AssignmentsClient from './AssignmentsClient';
import { IRunner, IRunnerFactory } from '../interfaces/IRunnerFactory';

export default class AssignmentRunner {
  public readonly queue: Queue;
  public beforeFinishFn?: () => Promise<void>;

  constructor(
    public runnerFactory: IRunnerFactory,
    private userAgentsToTestPath: string,
    private assignmentsDataOutDir: string,
    runnerConcurrency = 5,
  ) {
    this.queue = new Queue({ concurrency: runnerConcurrency });
  }

  async run(): Promise<void> {
    const runnerID = this.runnerFactory.runnerId();

    try {
      await this.runnerFactory.startFactory();
    } catch (error) {
      console.error(`failed to start runner factory ${runnerID}`, error);
      return;
    }

    try {
      await this.runFactoryRunners(runnerID);
    } catch (error) {
      console.error(`failed to run runners for factory runner with runner Id ${runnerID}`, error);
    } finally {
      try {
        await this.runnerFactory.stopFactory();
      } catch (error) {
        console.error(`failed to stop runner factory with Id ${runnerID}`, error);
      }
    }
  }

  async runFactoryRunners(runnerID: string): Promise<void> {
    console.log(`run all assignments for runner: ${runnerID}!`);

    const assignmentsClient = new AssignmentsClient(`runner-${runnerID}`);
    const assignments = await assignmentsClient.start({
      dataDir: this.assignmentsDataOutDir,
      userAgentsToTestPath: this.userAgentsToTestPath,
    });

    for (const { id: assignmentId } of assignments) {
      void this.queue.add(async () => {
        let assignment: IAssignment;
        console.log(`Getting assignment %s of %s`, assignmentId, assignments.length);
        try {
          assignment = await assignmentsClient.activate(assignmentId);
        } catch (error) {
          console.log('ERROR activating assignment: ', error);
          process.exit();
        }

        console.log(
          '[%s._] RUNNING %s assignment (%s)',
          assignment.sessionId,
          assignment.type,
          assignment.id,
        );

        let runner: IRunner;
        try {
          runner = await this.runnerFactory.spawnRunner(assignment);
        } catch (error) {
          console.error(`failed to create runner ${runnerID}`, error);
          return;
        }

        try {
          await runner.run(assignment);
        } catch (error) {
          console.error(`runner ${runnerID} run failed with exception`, error);
        } finally {
          try {
            await runner.stop();
          } catch (error) {
            console.error(`failed to stop runner ${runnerID}`, error);
          }
        }
      });
    }

    await this.queue.onIdle();
    if (this.beforeFinishFn) await this.beforeFinishFn();
    await assignmentsClient.finish();
    console.log('FINISHED');
  }
}
