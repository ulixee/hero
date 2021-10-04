import DomNode from './DomNode';
import { IDomFrameContext } from './DomRebuilder';

export default class XPathGenerator {
  constructor(readonly domContext: IDomFrameContext) {}

  getTagPath(domNode: DomNode, includeLastTagIndex = true): string {
    let path = '';
    do {
      const includeIndices = !path && includeLastTagIndex;
      path = this.getNodeRelativePath(domNode, includeIndices) + path;

      domNode = domNode.parentNode;
    } while (domNode && domNode.tagName);
    return path;
  }

  count(path: string): string {
    return `count(${path})`;
  }

  countTagsWithText(tag: string, text: string): string {
    return `count(//${tag}[text()="${text}"])`;
  }

  textContent(path: string): string {
    return `string(${path})`;
  }

  attributeSelector(basePath: string, domNode: DomNode): string {
    let newPath = basePath;
    if (domNode.attributes) {
      for (const [name, value] of Object.entries(domNode.attributes)) {
        newPath += `[@${name}="${value}"]`;
      }
    }
    return newPath;
  }

  getIdPath(domNode: DomNode): string {
    return `//${domNode.tagName}[@id="${domNode.id}"]`;
  }

  private getNodeRelativePath(domNode: DomNode, includeTagIndex = true): string {
    let nodePath = `/${domNode.tagName}`;
    const parent = domNode.parentNode;
    if (parent && includeTagIndex) {
      const siblingsOfTag = parent.children.filter(x => x.tagName === domNode.tagName);
      if (siblingsOfTag.length > 1) {
        nodePath += `[${siblingsOfTag.indexOf(domNode) + 1}]`;
      }
    }
    return nodePath;
  }

  static createEvaluateExpression(xpaths: string[]): string {
    return `${JSON.stringify(xpaths)}.map(query => {
    try {
      const result = document.evaluate(query, document);
      if (result.resultType === XPathResult.NUMBER_TYPE) return result.numberValue;
      else if (result.resultType === XPathResult.BOOLEAN_TYPE) return result.booleanValue;
      else if (result.resultType === XPathResult.STRING_TYPE) return result.stringValue;
    } catch(err) {
      return err.message;
    }
})`;
  }
}
