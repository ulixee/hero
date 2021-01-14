import 'source-map-support/register';
import agent, {
  ConnectionFactory,
  IConnectionToCoreOptions,
  RemoteConnectionToCore,
} from '@secret-agent/client';
import CoreProcess from '@secret-agent/core/lib/CoreProcess';

export * from '@secret-agent/client';
export default agent;

ConnectionFactory.createLocalConnection = (options: IConnectionToCoreOptions) => {
  const coreHost = CoreProcess.spawn(options);
  return new RemoteConnectionToCore({
    ...options,
    host: coreHost,
  });
};
