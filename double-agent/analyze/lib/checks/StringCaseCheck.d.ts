import StringCheck from './StringCheck';
import { CheckType } from './BaseCheck';
export default class StringCaseCheck extends StringCheck {
    readonly prefix = "STRC";
    readonly type = CheckType.Individual;
    get signature(): string;
    get args(): any[];
}
