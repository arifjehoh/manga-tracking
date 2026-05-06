# No authentication

Manga Tracker requires no authentication. It's a single-user personal tool, expected to run behind a firewall or on localhost. Access control is enforced at the deployment layer (network, firewall), not the application.

**Why:** Simplifies development, deployment, and day-to-day use. Single-user scope has no multi-tenancy concerns. If future needs require auth (e.g., multi-user or public hosting), it's straightforward to add as middleware without touching core logic.

**Consequences:** Users must rely on network security. The app is not suitable for public internet exposure without additional auth gates.
