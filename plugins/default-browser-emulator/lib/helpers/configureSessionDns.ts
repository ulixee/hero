import { DnsOverTlsProviders, IBrowserEmulator } from "@secret-agent/plugin-utils";

export default function configureSessionDns(emulator: IBrowserEmulator, settings) {
  settings.dnsOverTlsConnection = DnsOverTlsProviders.Cloudflare;
}
