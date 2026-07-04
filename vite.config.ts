import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { fetchKtuAnnouncements, fetchKtuAttachmentBase64 } from "./api/_ktu-client.js";
import { handleKtuProxy } from "./api/_ktu-proxy.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    {
      name: "local-announcements-api",
      apply: "serve",
      enforce: "pre",
      configureServer(server) {
        server.middlewares.use("/api/announcements", async (req, res) => {
          if (req.method !== "GET" && req.method !== "OPTIONS") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
            return;
          }

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          try {
            const announcements = await fetchKtuAnnouncements({ pageNumber: 0, dataSize: 30 });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                source: "ktu-bot-style-api",
                count: announcements.length,
                announcements,
              })
            );
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Server error",
              })
            );
          }
        });

        server.middlewares.use("/api/ktu-proxy", async (req, res) => {
          if (req.method !== "POST" && req.method !== "OPTIONS") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
            return;
          }

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          console.log("[Vite Proxy] Received request for /api/ktu-proxy");

          try {
            let bodyStr = "";
            for await (const chunk of req) {
              bodyStr += chunk;
            }
            const body = JSON.parse(bodyStr || "{}");
            console.log("[Vite Proxy] Action:", body.action);

            const result = await handleKtuProxy(body);

            console.log(
              "[Vite Proxy] Action success:",
              result.success,
              "Name parsed:",
              result.studentInfo?.name || "none"
            );

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (error) {
            console.error("[Vite Proxy] Error:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Proxy request failed",
              })
            );
          }
        });

        server.middlewares.use("/api/announcement-attachment", async (req, res) => {
          if (req.method !== "GET" && req.method !== "OPTIONS") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
            return;
          }

          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          try {
            const reqUrl = new URL(req.url || "", "http://127.0.0.1");
            const encryptId = reqUrl.searchParams.get("encryptId") || "";
            const fileName = (reqUrl.searchParams.get("name") || "announcement-attachment.pdf").replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            );

            if (!encryptId) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, error: "Missing encryptId" }));
              return;
            }

            const base64Data = await fetchKtuAttachmentBase64(encryptId);
            const fileBuffer = Buffer.from(base64Data, "base64");
            const isPdf = /\.pdf$/i.test(fileName) || base64Data.startsWith("JVBERi0");

            res.statusCode = 200;
            res.setHeader("Content-Type", isPdf ? "application/pdf" : "application/octet-stream");
            res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
            res.end(fileBuffer);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Attachment fetch failed",
              })
            );
          }
        });
      },
    },
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
