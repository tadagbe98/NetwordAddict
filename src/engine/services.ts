import { NetworkDevice, NetworkPacket, DhcpPoolConfig, DnsRecord } from '../types/network';
import { numberToIp, ipToNumber } from './layer3Routing';

export function handleDhcpDiscover(
  server: NetworkDevice,
  packet: NetworkPacket
): { assignedIp: string; mask: string; gateway: string; dns: string } | null {
  // Find a DHCP pool configured on this server or router
  let pools: DhcpPoolConfig[] = [];

  if (server.serverServices?.dhcp.enabled) {
    pools = server.serverServices.dhcp.pools;
  } else if (server.dhcpPools && server.dhcpPools.length > 0) {
    pools = server.dhcpPools;
  }

  if (pools.length === 0) return null;

  const pool = pools[0];
  const netNum = ipToNumber(pool.network);
  // Pick an offset IP in the pool (e.g. + 10 to + 50)
  const offset = 10 + (Math.floor(Math.random() * 30));
  const assignedIp = numberToIp(netNum + offset);

  return {
    assignedIp,
    mask: pool.mask || '255.255.255.0',
    gateway: pool.gateway || pool.network,
    dns: pool.dnsServer || '8.8.8.8',
  };
}

export function handleDnsQuery(
  server: NetworkDevice,
  domain: string
): string | null {
  if (!server.serverServices?.dns.enabled) return null;

  const record = server.serverServices.dns.records.find(
    (r) => r.domain.toLowerCase() === domain.toLowerCase()
  );

  return record ? record.ip : null;
}

export function handleHttpRequest(
  server: NetworkDevice,
  path: string = '/'
): { statusCode: number; title: string; html: string } | null {
  if (!server.serverServices?.http.enabled) return null;

  return {
    statusCode: 200,
    title: server.serverServices.http.title || 'NetSim Enterprise Web Server',
    html: server.serverServices.http.contentHtml || `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h1 style="color: #2563eb;">Bienvenue sur le Serveur Web NetSim Pro</h1>
        <p>Ce serveur web virtuel répond aux requêtes HTTP au sein de la topologie réseau.</p>
        <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 15px;">
          <strong>Statut :</strong> 200 OK | Protocole : HTTP/1.1 | Serveur : NetSim-HTTPd v2.4
        </div>
      </div>
    `,
  };
}
