import OperatingSystem from './OperatingSystem';
export default class OperatingSystems {
    static filePath: string;
    private static internalById;
    static all(): OperatingSystem[];
    static byId(id: string): OperatingSystem;
    private static getById;
}
