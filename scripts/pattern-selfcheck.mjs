import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const mod = await server.ssrLoadModule("/src/lib/pattern/selfcheck.ts");
  await mod.run();
} finally {
  await server.close();
}
