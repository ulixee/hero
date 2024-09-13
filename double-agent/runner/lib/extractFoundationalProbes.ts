import ProbesGenerator from '@double-agent/config/lib/ProbesGenerator';

export default async function extractFoundationalProbes(profilesDir: string): Promise<void> {
  const probesGenerator = new ProbesGenerator(profilesDir);
  await probesGenerator.clearBuckets();
  await probesGenerator.run();
  await probesGenerator.save();
}
