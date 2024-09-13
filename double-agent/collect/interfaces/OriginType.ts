enum OriginType {
  None = 'none',
  SameOrigin = 'same-origin',
  SameSite = 'same-site',
  CrossSite = 'cross-site',
}

const values = Object.values(OriginType);
export function getOriginType(type: string): OriginType | null {
  if (OriginType[type]) return OriginType[type];
  if (values.includes(type as OriginType)) return type as OriginType;
  return null;
}

export default OriginType;
