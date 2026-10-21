import { Container, Sprite, Texture } from "pixi.js";
import { gsap } from "gsap";

const ESCAPE_DURATION = 1.2;
const ESCAPE_SCALE = 1.8;

export default class Tiger extends Container {
  private readonly image: Sprite;
  private readonly initialScale: number;
  private readonly sound = new Audio("/sounds/tiger.mp3");

  private moving = false;
  private escaped = false;

  constructor(texture: Texture, displayWidth: number) {
    super();

    this.image = new Sprite(texture);

    // Keep the bottom center fixed while growing.
    this.image.anchor.set(0.5, 1);

    this.initialScale = displayWidth / texture.width;
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

      const targetScale = this.initialScale * ESCAPE_SCALE;

      await gsap.to(this.image.scale, {
        x: targetScale,
        y: targetScale,
        duration: ESCAPE_DURATION,
        ease: "back.out(1.2)",
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