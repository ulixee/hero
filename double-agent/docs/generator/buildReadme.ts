import * as Fs from 'fs';
import * as Path from 'path';
import { outputDir } from '../paths';

export default function buildReadme(): void {
  const readmeTemplatePath = Path.join(outputDir, '../readme-template.md');
  let main = Fs.readFileSync(readmeTemplatePath, 'utf8');

  const regexMatch = /({{inject=(.+\.md)}})/;
  while (regexMatch.test(main)) {
    const matches = regexMatch.exec(main);
    if (matches.length > 1) {
      const fileName = matches[2];
      const filePath = Path.join(outputDir, '../', fileName);
      const contents = Fs.readFileSync(filePath, 'utf8');
      main = main.replace(matches[0], contents);
    }
  }

  const readmePath = Path.resolve(outputDir, '../../README.md');
  Fs.writeFileSync(readmePath, main);
}
