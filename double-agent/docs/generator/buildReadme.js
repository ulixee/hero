"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildReadme;
const Fs = require("fs");
const Path = require("path");
const paths_1 = require("../paths");
function buildReadme() {
    const readmeTemplatePath = Path.join(paths_1.outputDir, '../readme-template.md');
    let main = Fs.readFileSync(readmeTemplatePath, 'utf8');
    const regexMatch = /({{inject=(.+\.md)}})/;
    while (regexMatch.test(main)) {
        const matches = regexMatch.exec(main);
        if (matches.length > 1) {
            const fileName = matches[2];
            const filePath = Path.join(paths_1.outputDir, '../', fileName);
            const contents = Fs.readFileSync(filePath, 'utf8');
            main = main.replace(matches[0], contents);
        }
    }
    const readmePath = Path.resolve(paths_1.outputDir, '../../README.md');
    Fs.writeFileSync(readmePath, main);
}
//# sourceMappingURL=buildReadme.js.map