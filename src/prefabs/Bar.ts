import {
  Assets,
  Container,
  Filter,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { gsap } from "gsap";

export type BarDirection = "left" | "right";

const SHADOW_OFFSET_Y = 8;
const HOVER_SCALE = 1.2;
const OPEN_DURATION = 0.5;
const CLOSE_DURATION = 0.2;
const SHARPEN_STRENGTH = 0.4;
const BADGE_RADIUS = 27;

export default class Bar extends Container {
  readonly barNumber: number;
  readonly direction: BarDirection;

  private readonly visuals = new Container();
  private readonly label = new Container();
  private readonly badge = new Graphics();
  private readonly image: Sprite;
  private readonly shadow: Sprite;
  private readonly sound = new Audio("/sounds/barOpen.mp3");

  private opened = false;
  private animating = false;
  private inputEnabled = true;

  constructor(
    barNumber: number,
    private readonly imageUrl: string,
    direction: BarDirection,
    private readonly shadowImageUrl: string,
  ) {
    super();

    this.barNumber = barNumber;
    this.direction = direction;

    this.shadow = Sprite.from(shadowImageUrl);
    this.shadow.anchor.set(0.5);
    this.shadow.y = SHADOW_OFFSET_Y;

    this.image = Sprite.from(imageUrl);
    this.image.anchor.set(0.5);

    this.addSharpenFilter();

    if (direction === "right") {
      this.image.scale.x = -1;
      this.shadow.scale.x = -1;
    }

    this.createBadge();

    this.visuals.addChild(this.shadow, this.image);
    this.addChild(this.visuals, this.label);

    // Only the drawn badge receives pointer input.
    this.visuals.eventMode = "none";
    this.label.eventMode = "passive";
    this.label.interactiveChildren = true;

    this.badge.cursor = "pointer";

    this.badge.on("pointerenter", () => {
      if (this.canInteract) {
        this.label.scale.set(HOVER_SCALE);
      }
    });

    this.badge.on("pointerleave", () => {
      this.label.scale.set(1);
    });

    this.badge.on("pointertap", () => {
      if (this.canInteract) {
        this.emit("selected", this.barNumber);
      }
    });

    this.updateInteraction();
  }

  get isOpen(): boolean {
    return this.opened;
  }

  private get canInteract(): boolean {
    return this.inputEnabled && !this.animating && !this.opened;
  }

  setInteractive(enabled: boolean): void {
    this.inputEnabled = enabled;
    this.updateInteraction();
  }

  private updateInteraction(): void {
    this.eventMode = this.canInteract ? "passive" : "none";
    this.label.eventMode = this.canInteract ? "passive" : "none";
    this.badge.eventMode = this.canInteract ? "static" : "none";

    if (!this.canInteract) {
      this.label.scale.set(1);
    }
  }

  private createBadge(): void {
    const badge = this.badge;

    // Shadow.
    badge.beginFill(0x071b20, 0.65);
    badge.drawCircle(0, 4, BADGE_RADIUS);
    badge.endFill();

    // Outer border.
    badge.lineStyle(2, 0x071b20);
    badge.beginFill(0xb77a32);
    badge.drawCircle(0, 0, BADGE_RADIUS);
    badge.endFill();

    // Gold rim.
    badge.lineStyle(2, 0xffedac);
    badge.beginFill(0xe9b85b);
    badge.drawCircle(0, -1, BADGE_RADIUS - 3);
    badge.endFill();

    // Dark center.
    badge.lineStyle(2, 0x071b20);
    badge.beginFill(0x12434a);
    badge.drawCircle(0, -1, BADGE_RADIUS - 7);
    badge.endFill();

    // Upper highlight.
    badge.lineStyle(0);
    badge.beginFill(0xffffff, 0.08);
    badge.drawEllipse(0, -10, 14, 6);
    badge.endFill();

    const number = new Text(String(this.barNumber), {
      fontFamily: ["Arial Black", "Arial", "sans-serif"],
      fontSize: 32,
      fontWeight: "bold",
      fill: 0xfff4cf,
      stroke: 0x071b20,
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowAlpha: 0.5,
      dropShadowDistance: 2,
      dropShadowAngle: Math.PI / 2,
    });

    number.anchor.set(0.5);
    number.y = -1;

    this.label.addChild(badge, number);
  }

  async open(): Promise<void> {
    if (this.opened || this.animating) {
      return;
    }

    this.animating = true;
    this.updateInteraction();

    try {
      const [imageTexture, shadowTexture] = await Promise.all([
        Assets.load<Texture>(this.imageUrl),
        Assets.load<Texture>(this.shadowImageUrl),
      ]);

      this.image.texture = imageTexture;
      this.shadow.texture = shadowTexture;

      this.sound.currentTime = 0;
      void this.sound.play().catch(console.warn);

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
    const direction = this.direction === "left" ? -1 : 1;
    const distance = this.image.width;
    const targetX = opening ? direction * distance : 0;

    await gsap.to([this.visuals, this.label], {
      x: targetX,
      duration: opening ? OPEN_DURATION : CLOSE_DURATION,
      ease: opening ? "power2.inOut" : "power2.in",
    });
  }

  private addSharpenFilter(): void {
    const sharpen = new Filter(
      undefined,
      `
        varying vec2 vTextureCoord;

        uniform sampler2D uSampler;
        uniform vec4 inputPixel;
        uniform vec4 inputClamp;
        uniform float strength;

        vec4 sampleColor(vec2 position) {
          return texture2D(
            uSampler,
            clamp(position, inputClamp.xy, inputClamp.zw)
          );
        }

        void main() {
          vec2 pixel = inputPixel.zw;
          vec4 center = sampleColor(vTextureCoord);

          vec3 neighbours =
            sampleColor(vTextureCoord + vec2(pixel.x, 0.0)).rgb +
            sampleColor(vTextureCoord - vec2(pixel.x, 0.0)).rgb +
            sampleColor(vTextureCoord + vec2(0.0, pixel.y)).rgb +
            sampleColor(vTextureCoord - vec2(0.0, pixel.y)).rgb;

          vec3 color =
            center.rgb * (1.0 + 4.0 * strength) -
            neighbours * strength;

          gl_FragColor = vec4(
            clamp(color, vec3(0.0), vec3(center.a)),
            center.a
          );
        }
      `,
      { strength: SHARPEN_STRENGTH },
    );

    sharpen.resolution = window.devicePixelRatio || 1;

    this.image.filters = [sharpen];
  }
}