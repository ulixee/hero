import SecretAgentSocketServer from './lib/Server';

(async function run() {
  const server = new SecretAgentSocketServer({ port: 8124 });
  await server.listen();
  console.log('Server ready!');
})().catch(error => {
  console.log(error);
});
