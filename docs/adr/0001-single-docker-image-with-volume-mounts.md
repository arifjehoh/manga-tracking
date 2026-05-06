# Single Docker image with volume-mounted data

We deploy Manga Tracker as a single Docker image that runs on any machine. Persistent data (SQLite DB, images directory) are volume-mounted from the host, not embedded in the image.

**Why:** Portability and data independence. Users can run the same image across dev, staging, and production with different data volumes. Keeps image size small and avoids data loss on container restarts. Auto-initialization on first run (empty DB, empty images dir) makes setup frictionless.

**Alternatives:** Separate containerized services (overkill for single-user scope), or embedding data in image (complicates versioning and recovery).
