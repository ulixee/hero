const sameSiteContext = ['none', 'strict', 'lax'] as const;

type SameSiteContext = typeof sameSiteContext[number];

export function isSameSiteContext(type: string) {
  return sameSiteContext.includes(type as any);
}

export default SameSiteContext;
