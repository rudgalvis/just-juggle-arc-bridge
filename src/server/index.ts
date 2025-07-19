import cors from "cors";
import express from "express";
import { ArcMacService } from "../services/arc-mac.service";

const server = express();
const port = process.env.PORT || 55513; // random port representing JJGLE where 5 is J & G, 1 is L, 3 is E
server.use(cors());

server.get("/ping", async (req, res) => {
  res.status(200);
  res.send("pong");
});

server.get("/recent-space", async (_, res) => {
  if (process.env.MODE === "test") console.time(`Space name parsed`);

  const arcMacService = new ArcMacService();
  const spaceName = await arcMacService.getLastActiveSpaceName();

  if (process.env.MODE === "test") console.timeEnd(`Space name parsed`);

  if (!spaceName) return res.json({ error: "No space name found" });

  res.json({
    spaceName,
  });
});

export const startServer = (p = port) =>
  server.listen(p, () => {
    console.log(`Server running at http://localhost:${p}/`);
  });
