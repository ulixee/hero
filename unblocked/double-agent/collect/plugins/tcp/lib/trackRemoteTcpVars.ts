import { EventEmitter } from 'events';
import * as os from 'os';
import Config from '@double-agent/config';

let device = Config.collect.tcpNetworkDevice;
if (os.platform() === 'linux') device = 'eth0';

const isDebug = !!Config.collect.tcpDebug;

export default function trackRemoteTcpVars(serverPort: string | number) {
  const pcap: any = require('pcap'); // has to be 'any' so that it can deploy on windows
  const packets: {
    [source: string]: {
      windowSize: number;
      ttl: number;
    };
  } = {};

  const emitter = new EventEmitter();
  let pcapSession: any;
  let hasError;
  try {
    const tcpTracker = new pcap.TCPTracker();
    // @ts-ignore
    pcapSession = new pcap.PcapSession(
      true,
      device,
      `ip proto \\tcp and (tcp port ${serverPort || 443})`,
    );

    if (isDebug) {
      tcpTracker.on('session', session => {
        console.log(`Start of session between ${session.src_name} and ${session.dst_name}`);
      });

      tcpTracker.on('end', session => {
        console.log(`End of TCP session between ${session.src_name} and ${session.dst_name}`);
      });
    }

    pcapSession.on('packet', raw_packet => {
      const packet = pcap.decode.packet(raw_packet);
      const ethPayload = packet.payload;
      const ipv4 = ethPayload.payload;
      const tcpPayload = ipv4.payload;
      if (!tcpPayload || !ipv4) return;
      const addr = `${ipv4.saddr}:${tcpPayload.sport}`;
      if (!packets[addr]) {
        packets[addr] = {
          // store without hops
          ttl: 2 ** Math.ceil(Math.log2(ipv4.ttl)),
          windowSize: tcpPayload.windowSize,
        };
        emitter.emit(addr, packets[addr]);
      }
      tcpTracker.track_packet(packet);
    });
  } catch (err) {
    hasError = true;
    console.log(err);
  }

  async function getPacket(addr: string) {
    let packet = packets[addr];
    if (!packet) {
      packet = await new Promise(resolve => {
        emitter.once(addr, resolve);
      });
    }
    return packet;
  }

  return {
    hasError,
    getPacket,
    stop: () => pcapSession.close(),
  };
}
