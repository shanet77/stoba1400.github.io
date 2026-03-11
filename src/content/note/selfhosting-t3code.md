---
title: Selfhosting T3Code (And not binding to Tailscale)
timestamp: 2026-03-10 17:37:56-05:00
tags: [Homelabbing,selfhost,code,ai,t3]
description: spinning up another LXC...
---

## What is T3Code?

For those unfamiliar [^1], the aforementioned [T3Code](https://github.com/pingdotgg/t3code) is a custom, perfomant web UI for OpenAI's [Codex](https://github.com/openai/codex). 
The project was created by [Ping.gg](https://ping.gg/), the company run by [t3dotgg](https://youtube.com/@t3dotgg). It's in an early alpha state [^2]

## What's the point of posting this?

I spent too much time on the setup I have now, so we're making it work for what I've done. I blew up my barebones Debian setup for the ever-loved [Proxmox](https://www.proxmox.com/en/), balancing LXCs and VMs. It will remain, and I will be stubborn!
After OpenAI doubled its rate limits[^3] using the Codex desktop app, I started moving my workflow to the desktop version. Naturally, a few issues came up:
- Performance issues
- Memory hogging
- Aimed more for vibe-coders[^4] or running multiple agents across multiple projects
   - Code diffs prior to write are annoying to view

In an attempt to give these GUI apps a try, it was only right to try the most newest, most hyped one. It's fun to try out the "bleeding edge" every now and then. Also Tailscale was mentioned...

## Okay, How?
The repo has a [REMOTE.md](https://github.com/pingdotgg/t3code/blob/main/REMOTE.md) that provides a guide on remote access to the application. This works to expose the application over the LAN and host it on a Tailnet. However, there were a couple more steps to make this work in my Proxmox setup and have a proper subdomain rather than accessing the Tailscale IP or it's MagicDNS.

### Creating a Home
Typically, I run most of my services as containerized applications in a Debian VM. Since T3Code will be running directly on the host and possibly be short-lived, a new LXC seemed to be the best way to go. I spun up a new Debian 13 LXC[^5] with 8GiB memory allocated, 10G of storage, 512MiB of swap, and a single CPU core. I definitely allocated more memory than necessary, so feel free to tune this down.
From there, I needed [Bun](https://bun.com/) and Node to build the project. I chose to use [fnm](https://github.com/Schniz/fnm) to manage the node installation on the LXC. Once Git was set up, it was time to move on.

### A Couple Steps More
Clone it from GitHub. it's linked above.
Make sure that the Codex CLI is also installed, linked above.

### Running the Application
For this step and the next, the T3Code docs cover it well. The only thing I found necessary to add was `VITE_WS_URL=wss://your.domain.com` as an environment variable if using a reverse proxy.
It can be useful to have a process manager like [pm2](https://pm2.keymetrics.io/) to run T3Code in the background like `pm2 start "bun run --cwd apps/server start -- --host 0.0.0.0 --port 3773 --no-browser" --name t3code`

### Reverse Proxy and DNS
I have a good enough domain that I use for my internal services, and T3Code was to become an accessible subdomain in Caddy. It's pretty straight forward to do this:
```
t3code.your.domain {
        tls {
                dns cloudflare {$CLOUDFLARE_API_TOKEN}
        }
        reverse_proxy YOUR_T3_IP:PORT
}
```

Create a DNS rewrite in Adguard or any other preferred DNS server, and there we go!

## Closing
Slight hiccups to getting this running in a non-traditional way, but smooth overall. I will say that so far it lives up to being a better alternative to the Codex desktop application. We'll see if my stance changes on GUIs in the next couple of weeks-months.



[^1]: Or chronically online
[^2]: Both described by the creator and by the fact that multiple commits have been written since I started writing this
[^3]: Not that I ever came close to the rate limits. Not much of an "agents" person
[^4]: No shade at the concept of vibe-coding or the like, but it's not quite what I'm going for at the moment
[^5]: For those unaware of creating one or don't have a template, there's always [Proxmox Helper Scripts](https://community-scripts.github.io/ProxmoxVE/scripts?id=debian&category=Operating+Systems)
