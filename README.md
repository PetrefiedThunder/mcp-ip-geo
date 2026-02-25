# mcp-ip-geo

Geolocate IP addresses, detect VPNs/proxies, and batch lookup — free, no API key.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `lookup_ip` | Get geolocation data for an IP address. |
| `batch_lookup` | Look up multiple IPs at once (max 100). |
| `get_my_ip` | Get the current machine's public IP and geolocation. |
| `check_vpn` | Check if an IP is a VPN/proxy/hosting (uses ip-api pro fields on free tier — limited). |
| `reverse_dns` | Get reverse DNS for an IP. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-ip-geo.git
cd mcp-ip-geo
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ip-geo": {
      "command": "node",
      "args": ["/path/to/mcp-ip-geo/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-ip-geo
```

## License

MIT
