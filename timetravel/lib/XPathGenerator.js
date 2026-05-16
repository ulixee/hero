"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class XPathGenerator {
    constructor(domContext) {
        this.domContext = domContext;
    }
    getTagPath(domNode, includeLastTagIndex = true) {
        let path = '';
        do {
            const includeIndices = !path && includeLastTagIndex;
            path = this.getNodeRelativePath(domNode, includeIndices) + path;
            domNode = domNode.parentNode;
        } while (domNode && domNode.tagName);
        return path;
    }
    count(path) {
        return `count(${path})`;
    }
    countTagsWithText(tag, text) {
        return `count(//${tag}[text()="${text}"])`;
    }
    textContent(path) {
        return `string(${path})`;
    }
    attributeSelector(basePath, domNode) {
        let newPath = basePath;
        if (domNode.attributes) {
            for (const [name, value] of Object.entries(domNode.attributes)) {
                newPath += `[@${name}="${value}"]`;
            }
        }
        return newPath;
    }
    getIdPath(domNode) {
        return `//${domNode.tagName}[@id="${domNode.id}"]`;
    }
    getNodeRelativePath(domNode, includeTagIndex = true) {
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
    static createEvaluateExpression(xpaths) {
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
exports.default = XPathGenerator;
//# sourceMappingURL=XPathGenerator.js.map