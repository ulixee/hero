import 'source-map-support/register';
import agent, {
  ConnectionFactory,
  ICoreConnectionOptions,
  RemoteCoreConnection,
} from '@secret-agent/client';
import CoreProcess from '@secret-agent/core/lib/CoreProcess';

export * from '@secret-agent/client';
export default agent;

ConnectionFactory.createLocalConnection = (options: ICoreConnectionOptions) => {
  const coreHost = CoreProcess.spawn(options);
  return new RemoteCoreConnection({
    ...options,
    host: coreHost,
  });
};
