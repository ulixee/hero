// import IRequestDetails from "@double-agent/collect/interfaces/IRequestDetails";
//
// keep the browser up but clear the cookies... can you still be tracked.
//
// private getSessionFromAddressAndPort(requestDetails: IRequestDetails) {
//   const addrParts = requestDetails.remoteAddress.split(':');
//   const addrPort = addrParts.pop();
//   const addrIp = addrParts.join(':');
//
//   for (const session of Object.values(this.sessions)) {
//     if (
//         session.requests.some(x => {
//           // are any remote ips the same as this one, just off by 10 ports?
//           const parts = x.remoteAddress.split(':');
//           const port = parts.pop();
//           const ip = parts.join(':');
//           if (ip !== addrIp) return false;
//           return Math.abs(Number(addrPort) - Number(port)) <= 10;
//         })
//     ) {
//       return session.id;
//     }
//   }
// }
