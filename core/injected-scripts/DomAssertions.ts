import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IPageStateAssertionBatch, {
  IAssertionAndResult,
} from '@ulixee/hero-interfaces/IPageStateAssertionBatch';

declare let JsPath: any;

class DomAssertions {
  private static assertionBatchesById: Record<string, IPageStateAssertionBatch['assertions']> = {};

  public static install(id: string, assertions: IPageStateAssertionBatch['assertions']): void {
    this.assertionBatchesById[id] = assertions;
  }

  public static clear(id: string): void {
    delete this.assertionBatchesById[id];
  }

  public static xpath(
    xpath: string,
    comparison: IAssertionAndResult['comparison'],
    expectedResult: any,
  ): { isValid: boolean; failedResult?: any } {
    const result = document.evaluate(xpath, document);
    let value = null;
    if (result.resultType === XPathResult.BOOLEAN_TYPE) {
      value = result.booleanValue;
    } else if (result.resultType === XPathResult.NUMBER_TYPE) {
      value = result.numberValue;
    } else if (result.resultType === XPathResult.STRING_TYPE) {
      value = result.stringValue;
    }

    if (!this.compare(value, comparison, expectedResult)) {
      return {
        isValid: false,
        failedResult: value,
      };
    }

    return { isValid: true };
  }

  public static async jsPath(
    assertion: IJsPath,
    comparison: IAssertionAndResult['comparison'],
    expectedResult: any,
  ): Promise<{ isValid: boolean; failedResult?: any }> {
    const jsPath = await JsPath.exec(assertion, null);
    if (jsPath.pathError) {
      return {
        isValid: false,
        failedResult: `PathError: ${jsPath.pathError.error}`,
      };
    }
    if (!this.compare(jsPath.value, comparison, expectedResult)) {
      return {
        isValid: false,
        failedResult: jsPath.value,
      };
    }

    return { isValid: true };
  }

  public static async run(id: string): Promise<{ failedIndices: Record<number, any> }> {
    const assertions = this.assertionBatchesById[id];
    if (!assertions) throw new Error('This assertion batch has not been installed or is cleared');
    const results = {};
    const promises: Promise<any>[] = [];
    for (let i = 0; i < assertions.length; i += 1) {
      const [, type, path, comparison, expectedResult] = assertions[i];
      try {
        if (type === 'xpath') {
          const result = this.xpath(path[0], comparison, expectedResult);
          if (!result.isValid) results[i] = result.failedResult;
        } else if (type === 'jspath') {
          const index = i;
          const promise = this.jsPath(path[0], comparison, expectedResult)
            .then(result => {
              // eslint-disable-next-line promise/always-return,@typescript-eslint/no-floating-promises
              if (!result.isValid) results[index] = result.failedResult;
            })
            .catch(err => {
              results[index] = `${err.name}: ${String(err)}`;
            });
          promises.push(promise);
        } else {
          results[i] = 'ERROR: Invalid assertion';
        }
      } catch (err) {
        results[i] = `${err.name}: ${String(err)}`;
      }
    }
    await Promise.all(promises);
    return { failedIndices: results };
  }

  private static compare<T>(
    value: T,
    comparison: IAssertionAndResult['comparison'],
    result: T,
  ): boolean {
    if (comparison === '!!') return !!value;
    if (comparison === '===') return value === result;
    if (comparison === '!==') return value !== result;
    if (comparison === '<=') return value <= result;
    if (comparison === '<') return value < result;
    if (comparison === '>=') return value >= result;
    if (comparison === '>') return value > result;
    return false;
  }
}
