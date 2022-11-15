import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import { createServer, Server as HTTPServer } from "http";
import { Image } from "image-js";
import path from "path";

const version = "height_new.png";

export class Server {
  private httpServer?: HTTPServer;
  private app?: Application;

  private terrainHeightArray?: Uint16Array;

  private readonly DEFAULT_PORT = 6100;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    let image = await Image.load(path.join(__dirname, `resources/${version}`));
    this.terrainHeightArray = new Uint16Array(image.width * image.height);
    for (let i = 0; i < image.width; i++) {
      for (let j = 0; j < image.height; j++) {
        this.terrainHeightArray[i * image.height + j] = image.getPixelXY(i, j)[0];
      }
    }
    this.app = express();

    this.httpServer = createServer(this.app);

    this.configureApp();
    this.configureRoutes();
    this.listen((port) => {
      console.log(`Server is listening on http://localhost:${port}`);
    });
  }

  private configureApp(): void {
    if (!this.app) {
      throw new Error("App is not defined");
    }
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private configureRoutes(): void {
    if (!this.app) {
      throw new Error("App is not defined");
    }
    this.app.get("/terrain", async (req, res) => {
      if (!this.terrainHeightArray) {
        res.status(500).send("Terrain not loaded");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": this.terrainHeightArray.buffer.byteLength,
      });
      res.end(Buffer.from(this.terrainHeightArray.buffer));
    });
    this.app.get("/terrainVersion", async (req, res) => {
      res.json({ version });
    });
  }

  public listen(callback: (port: number) => void): void {
    if (!this.httpServer) {
      throw new Error("Server is not defined");
    }
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
