import { IReleaseDates } from '../data';

export default function extractReleaseDateAndDescription(
  id: string,
  name: string,
  descriptions: { [key: string]: string },
  releaseDates: IReleaseDates,
): [string, string] {
  const slug = name
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\W/g, m => (/[À-ž]/.test(m) ? m : '-'))
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  const description = descriptions[id] ?? descriptions[slug];
  if (!description) throw new Error(`Missing description for ${id}`);

  const releaseDate = releaseDates[id] ?? releaseDates[slug] ?? releaseDates[`${id}-0`];
  if (!releaseDate) throw new Error(`Missing releaseDate for ${id}`);

  return [releaseDate, description];
}
