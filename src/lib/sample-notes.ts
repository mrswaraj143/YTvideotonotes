import type { NotesDocument } from "@/lib/types";

export const SAMPLE_NOTES: NotesDocument = {
  title: "Docker One-Shot Notes",
  subtitle: "Containers, images, and why your laptop stops crying",
  tags: ["DevOps", "Containers", "CLI", "One-Shot"],
  contentsTable: [
    "1. The problem Docker actually solves",
    "2. Images vs containers",
    "3. Dockerfile anatomy",
    "4. Ports, volumes, networks",
    "5. Compose for multi-service apps",
    "6. Cheat-sheet recap",
  ],
  sections: [
    {
      sectionTitle: "1. The problem Docker actually solves",
      summaryPoints: [
        "\"Works on my machine\" is a dependency + OS mismatch, not a personality trait.",
        "VMs package a whole guest OS. Heavy, slow to boot, hungry for RAM.",
        "Containers share the host kernel and ship only the app + its libs.",
        "Same image runs on a laptop, CI, and prod — identical userspace.",
      ],
      keyConceptBox: {
        title: "The Core Problem",
        description:
          "Ship the runtime with the app. If Node 18 + Debian libs are in the image, nobody has to install them by hand.",
      },
      diagram: {
        type: "mermaid",
        code: `flowchart LR
  Dev[Dev laptop] -->|push image| Hub[Registry]
  Hub -->|pull same SHA| CI[CI runner]
  Hub -->|pull same SHA| Prod[Production]
  Dev -.->|same userspace| Prod`,
      },
    },
    {
      sectionTitle: "2. Images vs containers",
      summaryPoints: [
        "Image = immutable snapshot (layers of filesystem + metadata).",
        "Container = a running (or stopped) instance of an image.",
        "One image can spawn many containers — like a class vs objects.",
        "Layers are cached; rebuilds only redo what changed.",
      ],
      comparisonTable: {
        headers: ["Image", "Container"],
        rows: [
          ["Read-only template", "Writable layer on top"],
          ["Built / pulled", "Created / started / stopped"],
          ["Identified by digest/tag", "Identified by container ID"],
          ["docker build / pull", "docker run / start"],
        ],
      },
      diagram: {
        type: "mermaid",
        code: `flowchart TB
  subgraph Image["Image layers"]
    A[FROM debian]
    B[apt install node]
    C[COPY app]
  end
  A --> B --> C
  C --> R1[Container A]
  C --> R2[Container B]`,
      },
    },
    {
      sectionTitle: "3. Dockerfile anatomy",
      summaryPoints: [
        "FROM picks a base. Smaller bases (alpine, distroless) = smaller attack surface.",
        "COPY vs ADD: prefer COPY. ADD unpacks archives and can fetch URLs.",
        "RUN executes at build time. CMD/ENTRYPOINT at run time.",
        "Put rarely-changing layers first so cache actually hits.",
      ],
      codeBlock: {
        language: "dockerfile",
        commands: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]`,
      },
      keyConceptBox: {
        title: "Cache rule of thumb",
        description:
          "COPY package.json + npm ci before COPY . so a code tweak does not reinstall the universe.",
      },
    },
    {
      sectionTitle: "4. Ports, volumes, networks",
      summaryPoints: [
        "EXPOSE is documentation. -p 8080:8080 actually publishes the port.",
        "Named volumes survive container deletion; bind mounts map a host folder.",
        "Bridge network is the default; user-defined networks give DNS by service name.",
        "Never bake secrets into an image. Use env files or a secret store.",
      ],
      comparisonTable: {
        headers: ["Bind mount", "Named volume"],
        rows: [
          ["Host path you choose", "Docker-managed path"],
          ["Great for live code reload", "Great for databases"],
          ["Permission drama on Linux", "More portable across hosts"],
        ],
      },
      codeBlock: {
        language: "bash",
        commands: `docker run -d --name api \\
  -p 8080:8080 \\
  -v app-data:/var/lib/data \\
  --env-file .env \\
  my-api:1.4`,
      },
    },
    {
      sectionTitle: "5. Compose for multi-service apps",
      summaryPoints: [
        "One YAML file describes app + db + cache + networks.",
        "docker compose up builds, networks, and starts in dependency order.",
        "Service names become hostnames on the compose network.",
        "Profiles and override files keep local vs prod sane.",
      ],
      diagram: {
        type: "mermaid",
        code: `flowchart LR
  Browser --> Web[web :3000]
  Web --> API[api :8080]
  API --> DB[(postgres)]
  API --> Redis[(redis)]`,
      },
      codeBlock: {
        language: "yaml",
        commands: `services:
  api:
    build: .
    ports: ["8080:8080"]
    depends_on: [db]
  db:
    image: postgres:16
    volumes: [pg:/var/lib/postgresql/data]
volumes:
  pg:`,
      },
    },
  ],
  cheatSheetRecap: [
    "Image = recipe. Container = a cooked plate.",
    "Share the kernel; isolate the userspace.",
    "Layer order is a cache strategy, not decoration.",
    "-p publishes. EXPOSE only hints.",
    "Volumes for state. Images for code.",
    "Compose is how you stop memorizing 12 docker run flags.",
    "Tag with versions. :latest is a foot-gun in prod.",
  ],
};
