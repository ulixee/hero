"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const p_queue_1 = require("p-queue");
const AssignmentsClient_1 = require("./AssignmentsClient");
class AssignmentRunner {
    constructor(runnerFactory, userAgentsToTestPath, assignmentsDataOutDir, runnerConcurrency = 5) {
        this.runnerFactory = runnerFactory;
        this.userAgentsToTestPath = userAgentsToTestPath;
        this.assignmentsDataOutDir = assignmentsDataOutDir;
        this.queue = new p_queue_1.default({ concurrency: runnerConcurrency });
    }
    async run() {
        const runnerID = this.runnerFactory.runnerId();
        try {
            await this.runnerFactory.startFactory();
        }
        catch (error) {
            console.error(`failed to start runner factory ${runnerID}`, error);
            return;
        }
        try {
            await this.runFactoryRunners(runnerID);
        }
        catch (error) {
            console.error(`failed to run runners for factory runner with runner Id ${runnerID}`, error);
        }
        finally {
            try {
                await this.runnerFactory.stopFactory();
            }
            catch (error) {
                console.error(`failed to stop runner factory with Id ${runnerID}`, error);
            }
        }
    }
    async runFactoryRunners(runnerID) {
        console.log(`run all assignments for runner: ${runnerID}!`);
        const assignmentsClient = new AssignmentsClient_1.default(`runner-${runnerID}`);
        const assignments = await assignmentsClient.start({
            dataDir: this.assignmentsDataOutDir,
            userAgentsToTestPath: this.userAgentsToTestPath,
        });
        for (const { id: assignmentId } of assignments) {
            void this.queue.add(async () => {
                let assignment;
                console.log(`Getting assignment %s of %s`, assignmentId, assignments.length);
                try {
                    assignment = await assignmentsClient.activate(assignmentId);
                }
                catch (error) {
                    console.error('ERROR activating assignment: ', error);
                    process.exit();
                }
                console.log('[%s._] RUNNING %s assignment (%s)', assignment.sessionId, assignment.type, assignment.id);
                let runner;
                try {
                    runner = await this.runnerFactory.spawnRunner(assignment);
                }
                catch (error) {
                    console.error(`failed to create runner ${runnerID}`, error);
                    return;
                }
                try {
                    await runner.run(assignment);
                }
                catch (error) {
                    console.error(`runner ${runnerID} run failed with exception`, error);
                }
                finally {
                    try {
                        await runner.stop();
                    }
                    catch (error) {
                        console.error(`failed to stop runner ${runnerID}`, error);
                    }
                }
            });
        }
        await this.queue.onIdle();
        if (this.beforeFinishFn)
            await this.beforeFinishFn();
        await assignmentsClient.finish();
        console.log('FINISHED');
    }
}
exports.default = AssignmentRunner;
//# sourceMappingURL=AssignmentRunner.js.map