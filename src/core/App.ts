import { Application } from "pixi.js";
import Game from "../scenes/Game";

export default class App extends Application {
  private readonly game: Game;

  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>("#app");

    if (!canvas) {
      throw new Error("Canvas #app was not found.");
    }

    super({
      view: canvas,
      resizeTo: window,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      backgroundColor: 0x18252b,
    });

    this.game = new Game();
    this.stage.addChild(this.game);

    this.renderer.on("resize", this.resizeScene);
    this.resizeScene();

    void this.initializeGame().catch((error: unknown) => {
      console.error("Game initialization failed:", error);
    });
  }

  private async initializeGame(): Promise<void> {
    await this.game.load();
    this.resizeScene();
  }

  private resizeScene = (): void => {
    const scale = Math.min(
      this.screen.width / this.game.designWidth,
      this.screen.height / this.game.designHeight,
    );

    this.game.scale.set(scale);

    this.game.position.set(
      (this.screen.width - this.game.designWidth * scale) / 2,
      (this.screen.height - this.game.designHeight * scale) / 2,
    );
  };
}