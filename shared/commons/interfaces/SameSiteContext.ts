const sameSiteContext = ['none', 'strict', 'lax'] as const;

type SameSiteContext = typeof sameSiteContext[number];

export function isSameSiteContext(type: string): boolean {
  return sameSiteContext.includes(type as any);
}

export default SameSiteContext;
