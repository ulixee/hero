import * as os from 'os';
import { v1 as uuidv1 } from 'uuid';

export function createIpcSocketPath(name: string): string {
  if (os.platform() === 'win32') {
    return `\\\\.\\pipe\\${name}`;
  }
  return `${os.tmpdir()}/${name}.sock`;
}

export function createId(): string {
  return uuidv1();
}
