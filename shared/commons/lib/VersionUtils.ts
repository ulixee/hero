import * as semver from 'semver';

export function isSemverSatisfied(version: string, isSatisfiedByVersion: string): boolean {
  return semver.satisfies(isSatisfiedByVersion, `~${version}`, { includePrerelease: true });
}
export function nextVersion(version: string): string {
  return semver.inc(version, 'patch');
}
