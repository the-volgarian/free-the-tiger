import { Assets, Container, Sprite, Text, Texture } from "pixi.js";
import { gsap } from "gsap";

export type BarDirection = "left" | "right";

const SHADOW_OFFSET_Y = 8;
const HOVER_SCALE = 1.2;
const OPEN_DURATION = 0.5;
const CLOSE_DURATION = 0.2;

export default class Bar extends Container {
  readonly barNumber: number;
  readonly direction: BarDirection;

  private readonly visuals = new Container();
  private readonly image: Sprite;
  private readonly shadow: Sprite;
  private readonly label: Text;
  private readonly sound = new Audio("/sounds/barOpen.mp3");

  private opened = false;
  private animating = false;
  private inputEnabled = true;
  private hingeX = 0;

  constructor(
    barNumber: number,
    private readonly imageUrl: string,
    direction: BarDirection,
    private readonly shadowImageUrl: string,
  ) {
    super();

    this.barNumber = barNumber;
    this.direction = direction;

    // Create the shadow.
    this.shadow = Sprite.from(shadowImageUrl);
    this.shadow.anchor.set(0.5);
    this.shadow.y = SHADOW_OFFSET_Y;

    // Create the bar image.
    this.image = Sprite.from(imageUrl);
    this.image.anchor.set(0.5);

    if (direction === "right") {
      this.image.scale.x = -1;
      this.shadow.scale.x = -1;
    }

    // Create the number.
    this.label = new Text(String(barNumber), {
      fontFamily: "Arial",
      fontSize: 32,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    });

    this.label.anchor.set(0.5);

    this.visuals.addChild(this.shadow, this.image);
    this.addChild(this.visuals, this.label);

    // Enable interaction through the image.
    this.interactiveChildren = true;
    this.cursor = "pointer";
    this.image.cursor = "pointer";
    this.image.eventMode = "static";
    this.shadow.eventMode = "none";
    this.label.eventMode = "none";

    this.on("pointerover", () => {
      this.label.scale.set(HOVER_SCALE);
    });

    this.on("pointerout", () => {
      this.label.scale.set(1);
    });

    this.on("pointertap", () => {
      this.emit("selected", this.barNumber);
    });

    this.updateInteraction();
  }

  get isOpen(): boolean {
    return this.opened;
  }

  setInteractive(enabled: boolean): void {
    this.inputEnabled = enabled;
    this.updateInteraction();
  }

  private updateInteraction(): void {
    const enabled =
      this.inputEnabled && !this.animating && !this.opened;

    this.eventMode = enabled ? "static" : "none";

    if (!enabled) {
      this.label.scale.set(1);
    }
  }

  async open(): Promise<void> {
    if (this.opened || this.animating) {
      return;
    }

    this.animating = true;
    this.updateInteraction();

    try {
      this.sound.currentTime = 0;
      void this.sound.play().catch(console.warn);

      const [imageTexture, shadowTexture] = await Promise.all([
        Assets.load<Texture>(this.imageUrl),
        Assets.load<Texture>(this.shadowImageUrl),
      ]);

      this.image.texture = imageTexture;
      this.shadow.texture = shadowTexture;

      // Place the hinge at the outer edge.
      this.hingeX = imageTexture.width / 2;

      if (this.direction === "left") {
        this.hingeX = -this.hingeX;
      }

      this.visuals.pivot.x = this.hingeX;
      this.visuals.x = this.hingeX;

      await this.animate(true);
      this.opened = true;
    } finally {
      this.animating = false;
      this.updateInteraction();
    }
  }

  async close(): Promise<void> {
    if (!this.opened || this.animating) {
      return;
    }

    this.animating = true;
    this.updateInteraction();

    try {
      await this.animate(false);
      this.opened = false;
    } finally {
      this.animating = false;
      this.updateInteraction();
    }
  }

  private async animate(opening: boolean): Promise<void> {
    const timeline = gsap.timeline({
      defaults: {
        duration: opening ? OPEN_DURATION : CLOSE_DURATION,
        ease: opening ? "power2.inOut" : "power2.in",
      },
    });

    timeline.to(this.visuals.scale, {
      x: opening ? -1 : 1,
    }, 0);

    timeline.to(this.label, {
      x: opening ? this.hingeX * 2 : 0,
    }, 0);

    await timeline;
  }
}