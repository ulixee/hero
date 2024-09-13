// import OriginType from '@double-agent/collect-controller/interfaces/OriginType';
// import ResourceType from '@double-agent/collect-controller/interfaces/ResourceType';
// import IRequestContext from '@double-agent/collect-controller/interfaces/IRequestContext';
// import { inspect } from 'util';
// import Config from '@double-agent/config';
//
// const pluginId = 'ip/address';
//
// export default class IpProfile {
//   constructor(readonly userAgentString: string, readonly requests: IIpRequest[]) {}
//
//   public save(): void {
//     if (!process.env.GENERATE_PROFILES) return;
//     const data = { userAgentString: this.userAgentString, requests: this.requests } as IIpProfile;
//     Config.saveProfile(pluginId, this.userAgentString, data);
//   }
//
//   public static fromContext(ctx: IRequestContext) {
//     const requests = ctx.session.requests.map(
//       x =>
//         ({
//           remoteAddress: x.remoteAddress,
//           secureDomain: x.secureDomain,
//           originType: x.originType,
//           resourceType: x.resourceType,
//           referer: x.referer,
//           url: x.url,
//         } as IIpRequest),
//     );
//     return new IpProfile(ctx.session.userAgentString, requests);
//   }
//
//   public static getPortRange(portString: string | number) {
//     const port = Number(portString);
//     const modulus = port % 500;
//     const startPort = modulus > 250 ? port - modulus : port - (port % 500) - 500;
//
//     return `${startPort}-${startPort + 1000}`;
//   }
//
//   public static analyze() {
//     const profiles = IpProfile.getAllProfiles();
//     const socketsPerSession: IIpAddressGroup[] = [];
//     for (const profile of profiles) {
//       const session: IIpAddressGroup = {
//         userAgentString: profile.userAgentString,
//         secureSockets: 0,
//         httpSockets: 0,
//         portRanges: [],
//         securePorts: [],
//         httpPorts: [],
//         socketsPerPage: [],
//         portUses: {},
//       };
//       socketsPerSession.push(session);
//
//       for (const request of profile.requests) {
//         const port = Number(request.remoteAddress.split(':').pop());
//         const portRange = IpProfile.getPortRange(port);
//         if (!session.portRanges.includes(portRange)) session.portRanges.push(portRange);
//
//         let page = session.socketsPerPage.find(x => x.url === request.referer);
//         if (!session.portUses[port]) session.portUses[port] = [];
//         session.portUses[port].push(
//           `${request.originType} ${request.resourceType} from ${request.referer?.replace(
//             '?sessionId=X',
//             '',
//           )}`,
//         );
//
//         if (!page) {
//           page = {
//             url: request.referer,
//             httpPorts: [],
//             securePorts: [],
//             requests: 0,
//           };
//           session.socketsPerPage.push(page);
//         }
//
//         page.requests += 1;
//
//         if (request.secureDomain === true) {
//           if (!session.securePorts.includes(port)) {
//             session.securePorts.push(port);
//             session.secureSockets += 1;
//             session.securePorts.sort();
//           }
//           if (!page.securePorts.includes(port)) {
//             page.securePorts.push(port);
//             page.securePorts.sort();
//           }
//         } else if (!session.httpPorts.includes(port)) {
//           session.httpPorts.push(port);
//           session.httpSockets += 1;
//           session.httpPorts.sort();
//
//           if (!page.httpPorts.includes(port)) {
//             page.httpPorts.push(port);
//             page.httpPorts.sort();
//           }
//         }
//       }
//     }
//     console.log(
//       inspect(
//         socketsPerSession.map(x => {
//           const portUses = Object.entries(x.portUses).map(([port, uses]) => uses.length);
//           const avgPortUses = portUses.reduce((p, c) => p + c, 0) / portUses.length;
//           return {
//             ranges: x.portRanges,
//             securePorts: x.securePorts.length,
//             httpPorts: x.httpPorts.length,
//             overlappingPorts: x.securePorts.filter(y => x.httpPorts.includes(y)).length,
//             requestsPerPort: Math.round(avgPortUses * 100) / 100,
//             minRequestsPerPort: Math.min(...portUses),
//             maxRequestsPerPort: Math.max(...portUses)
//           };
//         }),
//         false,
//         null,
//         true,
//       ),
//     );
//   }
//
//   public static getAllProfiles(): IIpProfile[] {
//     return Config.getProfiles(pluginId);
//   }
// }
//
// interface IIpAddressGroup {
//   userAgentString: string;
//   secureSockets: number;
//   httpSockets: number;
//   securePorts: number[];
//   httpPorts: number[];
//   portRanges: string[];
//   socketsPerPage: { url: string; securePorts: number[]; httpPorts: number[]; requests: number }[];
//   portUses: { [port: number]: string[] };
// }
//
// interface IIpProfile {
//   requests: IIpRequest[];
//   userAgentString: string;
// }
//
// interface IIpRequest {
//   url: string;
//   originType: OriginType;
//   resourceType: ResourceType;
//   referer: string;
//   secureDomain: boolean;
//   remoteAddress: string;
// }
