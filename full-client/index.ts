import 'source-map-support/register';
import agent, {
  ConnectionFactory,
  IConnectionToCoreOptions,
  RemoteConnectionToCore,
} from '@secret-agent/client';
import CoreProcess from '@secret-agent/core/lib/CoreProcess';
import ShutdownHandler from '@secret-agent/commons/ShutdownHandler';

export * from '@secret-agent/client';
export default agent;

let coreHost: Promise<string>;

ConnectionFactory.createLocalConnection = (options: IConnectionToCoreOptions) => {
  coreHost ??= CoreProcess.spawn(options);

  const connection = new RemoteConnectionToCore({
    ...options,
    host: coreHost,
  });

  ShutdownHandler.register(() => connection.disconnect());
  return connection;
};
