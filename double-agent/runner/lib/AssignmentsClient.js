"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@double-agent/config");
const fs_1 = require("fs");
const node_fetch_1 = require("node-fetch");
const qs = require("querystring");
const Tar = require("tar");
class AssignmentsClient {
    constructor(userId) {
        this.userId = userId;
        this.baseUrl = config_1.default.runner.assignmentsHost;
    }
    async downloadAssignmentProfiles(assignmentId, filesDir) {
        const filesStream = await this.get(`/download/${assignmentId}`, {
            userId: this.userId,
        });
        await fs_1.promises.mkdir(filesDir, { recursive: true }).catch(() => null);
        await new Promise((resolve, reject) => {
            filesStream
                .pipe(Tar.extract({
                cwd: filesDir,
                preserveOwner: false,
            }))
                .on('finish', resolve)
                .on('error', reject);
        });
    }
    async downloadAll(filesDir) {
        const filesStream = await this.get(`/download`, { userId: this.userId });
        await fs_1.promises.mkdir(filesDir, { recursive: true }).catch(() => null);
        await new Promise((resolve, reject) => {
            filesStream
                .pipe(Tar.extract({
                cwd: filesDir,
                preserveOwner: false,
            }))
                .on('finish', resolve)
                .on('error', reject);
        });
    }
    async activate(assignmentId) {
        const result = await this.get(`/activate/${assignmentId}`, {
            userId: this.userId,
        });
        return result.assignment;
    }
    /**
     * Create and activate a single assignment
     */
    async createSingleUserAgentIdAssignment(userAgentId, dataDir) {
        const { assignment } = await this.get('/', {
            userId: this.userId,
            userAgentId,
            dataDir,
        });
        return assignment;
    }
    async start(params) {
        const result = await this.get('/create', {
            userId: this.userId,
            ...params,
        });
        return result.assignments;
    }
    async finish() {
        await this.get('/finish', { userId: this.userId });
    }
    async get(path, params) {
        const paramStrs = qs.stringify(params);
        const res = await (0, node_fetch_1.default)(`${this.baseUrl}${path}?${paramStrs}`);
        const contentType = res.headers.get('content-type');
        if (contentType === 'application/json') {
            const data = await res.json();
            if (res.status >= 400) {
                throw new Error(data.message);
            }
            return data;
        }
        return res.body;
    }
}
exports.default = AssignmentsClient;
//# sourceMappingURL=AssignmentsClient.js.map