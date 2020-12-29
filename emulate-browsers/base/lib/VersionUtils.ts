export function getClosestNumberMatch(numToMatch: number, nums: number[]) {
  const sortedNums = nums.sort();
  let closest = sortedNums[0];
  for (const num of sortedNums) {
    if (num === numToMatch) {
      return num;
    }
    if (num < numToMatch) {
      closest = num;
    } else if (num > numToMatch) {
      break;
    }
  }
  return closest;
}

export function convertVersionsToTree(versions: string[]): IVersionTree {
  return versions.reduce((tree: any, version: string) => {
    const [major, minor, build] = version.split(/\.|-/);
    tree[major] = tree[major] || {};
    tree[major][minor] = tree[major][minor] || [];
    if (build) tree[major][minor].push(build);
    return tree;
  }, {});
}

export interface IVersionTree {
  [major: number]: {
    [minor: number]: number[];
  }
}
