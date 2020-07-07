const originTypes = ['none', 'same-origin', 'same-site', 'cross-site'] as const;

type OriginType = typeof originTypes[number];

export function isOriginType(type: string) {
  return originTypes.includes(type as any);
}

export default OriginType;
