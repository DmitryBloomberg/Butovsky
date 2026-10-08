# Butovsky

Production startup scripts for the React website in web_rep/v1.

## Requirements

- Debian or Ubuntu Linux with systemd.
- A normal deployment user with sudo access. Do not run start.sh as root.
- DNS for butovsky.duckdns.org pointing to this server, and inbound TCP port 3000 allowed in the server/provider firewall.

## Install and start

From the repository root, run:

    bash library.sh
    bash start.sh

library.sh installs Node.js 22 and npm on Debian/Ubuntu if a suitable Node.js/npm is missing, then installs the locked web dependencies with npm ci. start.sh builds web_rep/v1, creates /etc/systemd/system/butovsky-site.service, enables it at boot, starts it, and checks the local HTTP response. It prints the configured site URL after the check passes.

The default URL is http://butovsky.duckdns.org:3000. Override the port or displayed public URL when needed:

    PORT=3000 SITE_URL=http://butovsky.duckdns.org:3000 bash start.sh

The scripts do not update DuckDNS records, open firewall ports, configure HTTPS, or install a reverse proxy. For the plain HTTP URL to work, the domain must already resolve to this server and TCP port 3000 must be reachable. To serve HTTPS or use the standard ports 80/443, configure a reverse proxy and set SITE_URL to its public URL.

## Service operations

    sudo systemctl status butovsky-site
    sudo systemctl restart butovsky-site
    sudo journalctl -u butovsky-site -f

The service runs as the user who invoked start.sh, restarts if the process exits, and is enabled for automatic startup after reboot. It serves the production build and does not run the React development server.
