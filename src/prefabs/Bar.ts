import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { gsap } from "gsap";
import type { BarConfig } from "../config";

export type BarDirection = "left" | "right";

export default class Bar extends Container {
  readonly barNumber: number;
  readonly direction: BarDirection;

  private readonly visuals = new Container();
  private readonly label = new Container();
  private readonly badge = new Graphics();
  private readonly wrongRing = new Graphics();

  private readonly image: Sprite;
  private readonly shadow: Sprite;
  private readonly sound: HTMLAudioElement;
  private readonly wrongSound: HTMLAudioElement;

  private opened = false;
  private animating = false;
  private inputEnabled = true;

  constructor(
    barNumber: number,
    barTexture: Texture,
    direction: BarDirection,
    shadowTexture: Texture,
    private readonly config: BarConfig,
  ) {
    super();

    this.barNumber = barNumber;
    this.direction = direction;

    this.sound = new Audio(config.soundUrl);

    this.wrongSound = new Audio(config.wrongSelection.soundUrl);
    this.wrongSound.volume = config.wrongSelection.soundVolume;

    this.shadow = new Sprite(shadowTexture);
    this.shadow.anchor.set(0.5);
    this.shadow.y = config.shadowOffsetY;

    this.image = new Sprite(barTexture);
    this.image.anchor.set(0.5);

    if (direction === "right") {
      this.image.scale.x = -1;
      this.shadow.scale.x = -1;
    }

    this.createBadge();
    this.createWrongRing();

    this.visuals.addChild(this.shadow, this.image);
    this.addChild(this.visuals, this.label);

    // Only the badge receives pointer input.
    this.visuals.eventMode = "none";
    this.label.eventMode = "passive";
    this.label.interactiveChildren = true;
    this.badge.cursor = "pointer";

    this.badge.on("pointerenter", () => {
      if (this.canInteract) {
        this.label.scale.set(this.config.hoverScale);
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

  // Keep the badge size independent of the artwork scale.
  setBarScale(scale: number): void {
    this.visuals.scale.set(scale);
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
    const style = this.config.badge;

    // Shadow.
    this.badge.beginFill(style.shadow.color, style.shadow.alpha);
    this.badge.drawCircle(0, style.shadow.offsetY, style.radius);
    this.badge.endFill();

    // Outer border.
    this.badge.lineStyle(style.borderWidth, style.outlineColor);
    this.badge.beginFill(style.outerColor);
    this.badge.drawCircle(0, 0, style.radius);
    this.badge.endFill();

    // Gold rim.
    this.badge.lineStyle(style.borderWidth, style.rim.borderColor);
    this.badge.beginFill(style.rim.fillColor);
    this.badge.drawCircle(0, style.rim.offsetY, style.radius - style.rim.inset);
    this.badge.endFill();

    // Dark center.
    this.badge.lineStyle(style.borderWidth, style.outlineColor);
    this.badge.beginFill(style.center.fillColor);
    this.badge.drawCircle(
      0,
      style.center.offsetY,
      style.radius - style.center.inset,
    );
    this.badge.endFill();

    // Highlight.
    this.badge.lineStyle(0);
    this.badge.beginFill(style.highlight.color, style.highlight.alpha);
    this.badge.drawEllipse(
      0,
      style.highlight.offsetY,
      style.highlight.radiusX,
      style.highlight.radiusY,
    );
    this.badge.endFill();

    const number = new Text(String(this.barNumber), style.number.style);

    number.anchor.set(0.5);
    number.y = style.number.offsetY;
    number.eventMode = "none";

    this.label.addChild(this.badge, number);
  }

  private createWrongRing(): void {
    const feedback = this.config.wrongSelection;

    this.wrongRing.lineStyle(feedback.ringWidth, feedback.color);
    this.wrongRing.drawCircle(
      0,
      0,
      this.config.badge.radius + feedback.radiusOffset,
    );

    this.wrongRing.visible = false;
    this.wrongRing.eventMode = "none";

    this.label.addChild(this.wrongRing);
  }

  async showWrongSelection(): Promise<void> {
    if (this.opened || this.animating) {
      return;
    }

    this.animating = true;
    this.updateInteraction();

    const feedback = this.config.wrongSelection;

    this.wrongRing.alpha = 1;
    this.wrongRing.scale.set(1);
    this.wrongRing.visible = true;

    try {
      this.wrongSound.currentTime = 0;
      void this.wrongSound.play().catch(console.warn);

      const timeline = gsap.timeline();

      timeline.to(
        this.wrongRing,
        {
          alpha: 0,
          duration: feedback.duration,
          ease: "power1.in",
        },
        0,
      );

      timeline.to(
        this.wrongRing.scale,
        {
          x: feedback.scaleMultiplier,
          y: feedback.scaleMultiplier,
          duration: feedback.duration,
          ease: "power1.out",
        },
        0,
      );

      await timeline;
    } finally {
      this.wrongRing.visible = false;
      this.animating = false;
      this.updateInteraction();
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

    const targetX = opening
      ? direction * this.image.width * this.visuals.scale.x
      : 0;

    await gsap.to([this.visuals, this.label], {
      x: targetX,
      duration: opening ? this.config.openDuration : this.config.closeDuration,
      ease: opening ? "power2.inOut" : "power2.in",
    });
  }
}
