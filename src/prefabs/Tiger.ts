import { Container, Sprite, Texture } from "pixi.js";
import { gsap } from "gsap";
import type { TigerConfig } from "../config";

export default class Tiger extends Container {
  private readonly image: Sprite;
  private readonly initialScale: number;
  private readonly sound = new Audio("/sounds/tiger.mp3");

  private moving = false;
  private escaped = false;

  constructor(
    texture: Texture,
    private readonly config: TigerConfig,
  ) {
    super();

    this.image = new Sprite(texture);
    this.image.anchor.set(0.5, 1);

    this.initialScale = config.displayWidth / texture.width;
    this.image.scale.set(this.initialScale);

    this.addChild(this.image);
    this.eventMode = "none";
  }

  async escape(): Promise<void> {
    if (this.moving || this.escaped) {
      return;
    }

    this.moving = true;

    try {
      this.sound.currentTime = 0;
      void this.sound.play().catch(console.warn);

      const targetScale = this.initialScale * this.config.escapeScale;

      await gsap.to(this.image.scale, {
        x: targetScale,
        y: targetScale,
        duration: this.config.escapeDuration,
        ease: this.config.escapeEase,
      });

      this.escaped = true;
    } finally {
      this.moving = false;
    }
  }

  reset(): void {
    this.sound.pause();
    this.sound.currentTime = 0;

    this.image.scale.set(this.initialScale);
    this.escaped = false;
  }
}
