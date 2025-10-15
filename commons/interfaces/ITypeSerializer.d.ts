export default interface ITypeSerializer {
    stringify(object: any): string;
    parse(object: string): any;
    replace(object: any): any;
}
