import * as Fs from 'fs';
import * as Path from 'path';
import { getDataDirectory } from '../lib/dirUtils';
import { safeOverwriteFile } from '../lib/fileUtils';
import Callsite from '../lib/Callsite';

export default class UlixeeConfig {
  public static get global(): UlixeeConfig {
    this.globalConfig ??= new UlixeeConfig(this.globalConfigDirectory);
    return this.globalConfig;
  }

  public static isCacheEnabled = process.env.NODE_END === 'production';

  private static globalConfigDirectory = Path.join(getDataDirectory(), 'ulixee');
  private static globalConfig: UlixeeConfig;

  private static configDirectoryName = '.ulixee';
  private static cachedConfigLocations: { [cwd_entrypoint: string]: string } = {};
  private static cachedConfigObjects: { [cwd_entrypoint: string]: UlixeeConfig } = {};

  public datastoreOutDir?: string;

  private get configPath(): string {
    return Path.join(this.directoryPath, 'config.json');
  }

  constructor(readonly directoryPath: string) {
    if (Fs.existsSync(this.configPath)) {
      const data = JSON.parse(Fs.readFileSync(this.configPath, 'utf8'));
      if (data.datastoreOutDir) {
        this.datastoreOutDir = Path.isAbsolute(data.datastoreOutDir)
          ? data.datastoreOutDir
          : Path.resolve(this.directoryPath, data.datastoreOutDir);
      }
    }
  }

  public save(): Promise<void> {
    return safeOverwriteFile(this.configPath, JSON.stringify(this.getData(), null, 2));
  }

  private getData(): IUlixeeConfig {
    return {
      datastoreOutDir: this.datastoreOutDir,
    };
  }

  public static load(runtimeLocation?: IRuntimeLocation): UlixeeConfig {
    runtimeLocation = this.useRuntimeLocationDefaults(runtimeLocation);
    const key = this.getLocationKey(runtimeLocation);
    if (!this.cachedConfigObjects[key]) {
      const directory = this.findConfigDirectory(runtimeLocation);
      if (directory === this.globalConfigDirectory) return UlixeeConfig.global;
      const config = new UlixeeConfig(directory);
      if (this.isCacheEnabled) this.cachedConfigObjects[key] = config;

      return config;
    }
    return this.cachedConfigObjects[key];
  }

  public static findConfigDirectory(
    runtimeLocation?: IRuntimeLocation,
    defaultToGlobal = true,
  ): string {
    runtimeLocation = this.useRuntimeLocationDefaults(runtimeLocation);
    const key = this.getLocationKey(runtimeLocation);
    if (!this.cachedConfigLocations[key]) {
      const configDirectory = this.traverseDirectories(runtimeLocation, defaultToGlobal);
      if (this.isCacheEnabled) this.cachedConfigLocations[key] = configDirectory;

      return configDirectory;
    }

    return this.cachedConfigLocations[key];
  }

  private static useRuntimeLocationDefaults(runtimeLocation?: IRuntimeLocation): IRuntimeLocation {
    return {
      entrypoint: runtimeLocation?.entrypoint ?? Callsite.getEntrypoint(),
      workingDirectory: runtimeLocation?.workingDirectory ?? process.cwd(),
    };
  }

  private static getLocationKey(runtimeLocation: IRuntimeLocation): string {
    return `${runtimeLocation.workingDirectory}_${runtimeLocation.entrypoint}`;
  }

  private static traverseDirectories(
    runtimeLocation: IRuntimeLocation,
    defaultToGlobal: boolean,
  ): string {
    const { entrypoint, workingDirectory } = runtimeLocation;
    // look up hierarchy from the entrypoint of the script
    let currentPath = Path.dirname(entrypoint);
    do {
      const upDirectory = Path.dirname(currentPath);
      if (upDirectory === currentPath) break;
      currentPath = upDirectory;

      const configPath = this.hasConfigDirectory(currentPath);
      if (configPath) return configPath;
    } while (currentPath.length && Fs.existsSync(currentPath));

    const configPath = this.hasConfigDirectory(workingDirectory);
    if (configPath) return configPath;

    if (!defaultToGlobal) return null;
    // global directory is the working directory
    return this.globalConfigDirectory;
  }

  private static hasConfigDirectory(path: string): string {
    const pathToCheck = Path.normalize(Path.join(path, this.configDirectoryName));
    if (Fs.existsSync(pathToCheck) && Fs.statSync(pathToCheck).isDirectory()) return pathToCheck;
  }
}

export interface IUlixeeConfig {
  datastoreOutDir?: string;
}

export interface IRuntimeLocation {
  workingDirectory: string;
  entrypoint: string;
}
