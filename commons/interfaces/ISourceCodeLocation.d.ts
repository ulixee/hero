export default interface ISourceCodeLocation {
    filename: string;
    source?: string;
    line: number;
    column: number;
}
