#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const RATE_LIMIT_MS = 500; // ip-api.com: 45 req/min free
let last = 0;

async function ipFetch(url: string): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IP API ${res.status}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-ip-geo", version: "1.0.0" });

server.tool("lookup_ip", "Get geolocation data for an IP address.", {
  ip: z.string().describe("IPv4 or IPv6 address"),
}, async ({ ip }) => {
  const d = await ipFetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
  if (d.status === "fail") throw new Error(d.message || "Lookup failed");
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("batch_lookup", "Look up multiple IPs at once (max 100).", {
  ips: z.array(z.string()).max(100),
}, async ({ ips }) => {
  const res = await fetch("http://ip-api.com/batch", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ips.map((ip) => ({ query: ip, fields: "status,country,countryCode,city,lat,lon,isp,org,query" }))),
  });
  const d = await res.json();
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("get_my_ip", "Get the current machine's public IP and geolocation.", {}, async () => {
  const d = await ipFetch("http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query");
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("check_vpn", "Check if an IP is a VPN/proxy/hosting (uses ip-api pro fields on free tier — limited).", {
  ip: z.string(),
}, async ({ ip }) => {
  // Free tier doesn't include proxy fields, use ipapi.is as fallback
  const d = await ipFetch(`https://api.ipapi.is/?q=${ip}`);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    ip: d.ip, isVpn: d.is_vpn, isProxy: d.is_proxy, isDatacenter: d.is_datacenter, isTor: d.is_tor,
    company: d.company?.name, asn: d.asn?.asn, location: d.location,
  }, null, 2) }] };
});

server.tool("reverse_dns", "Get reverse DNS for an IP.", {
  ip: z.string(),
}, async ({ ip }) => {
  const d = await ipFetch(`https://api.ipapi.is/?q=${ip}`);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    ip: d.ip, rdns: d.rdns, company: d.company, asn: d.asn, location: d.location,
  }, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
