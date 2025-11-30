---
title: Split-Horizon DNS w/ Adguard, Caddy, and Tailscale
timestamp: 2025-11-23 
tags: [Homelabbing, DNS, Networking, Tailscale]
series: Homelabbing
description: "How to configure split-horizon DNS in your homelab to maintain HTTPS and avoid having an always-on VPN connection"
toc: true
---

## What is Split-Horizon DNS?
Split-Horizon DNS (or split-brain, split DNS, etc), is a form of providing DNS information based on the source of the DNS request.

## Why Implement This?
The typical case is to avoid exposing internal IP addresses to external users. Entities often have internal services that do not need to be accessible via the public internet, and exposing them opens up a much larger attack vector.<br>
For homelabbers, this case certainly applies. An additional case that I found important to myself is avoiding an always-on VPN connection. When initially building out the infrastructure of the services, using my reverse proxy's subdomain configuration required always having my Wireguard VPN (Tailscale) on. I'm ultra-conservative when it comes to the battery life of my devices, so this became a priority to address.

## The How
### Prerequisites
Before digging into this, a couple of notes. By this point, I had already provisioned Debian Linux Containers (LXCs) using [Proxmox](https://proxmox.com/en/) for both [Caddy](https://caddyserver.com/) and [Adguard Home](https://adguard.com/en/adguard-home/overview.html). The Caddy LXC had [Tailscale](https://tailscale.com/kb/1031/install-linux) installed as well.

### Creating a Subdomain Reverse Proxy in Caddy
Before we start working on our DNS server, we need to configure a reverse proxy for a local service of our choice. I'm going to use [Glance](https://github.com/glanceapp/glance) as an example. We'll setup a subdomain glance.yourlab.com. To demonstrate this, I'm going to treat this domain as if it was purchased from Cloudflare. The Caddyfile would look like this:
```
glance.yourlab.com{
	tls {
		dns cloudflare {$CLOUDFLARE_API_TOKEN}
	}
	reverse_proxy YOUR_GLANCE_IP_ADDR:YOUR_GLANCE_PORT
}
```
Where `CLOUDFLARE_API_TOKEN` is an environment variable set as part of [caddy-dns/cloudflare](https://github.com/caddy-dns/cloudflare). Make sure to write this in your Caddyfile and then reload the Caddy service for changes to apply.

### Configuring Adguard
With our reverse proxy and Adguard up-and-running as a DNS server, let's configure some DNS rewrites. The DNS rewrite forwards queries for specified domains to the Caddy LXC IP, bypassing public resolvers.
To do this in Adguard Home, we can navigate to the DNS Rewrites page via Filters->DNS rewrites. From there, we can begin to create our rewrite with the `Add DNS rewrite` button. Let's configure it as such, replacing the information to match your domain/subdomain and reverse proxy IP address.

![Adguard Rewrite Example](/assets/adguard_rewrite_example.png)

### Using the DNS Server
Finally, we need to point our client devices to the DNS server. There are a couple ways we can do this: 
- The first way is to set the DNS server at the router-level, so that devices send DNS queries to the DNS address assigned by the router. 
- The second is to set the DNS server at the device-level so that the devices OS ignores the router DNS and instead reaches out to the designated DNS server IP.

For now, we're going to set it at the client device level.
<br>**Note:**
> On an iPhone, go to **Wi‑Fi → SSID info → Configure DNS**.
> > Set the DNS to “Manual” and enter your Adguard Home IP.
 
 This should point all requests from this device to our Adguard Home DNS Server.
