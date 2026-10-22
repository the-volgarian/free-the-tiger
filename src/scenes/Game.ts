import { Container, Graphics, Sprite, Text } from "pixi.js";
import { gsap } from "gsap";
import type { GameConfig } from "../config";
import AssetLoader from "../core/AssetLoader";
import Cage from "../prefabs/Cage";
import Tiger from "../prefabs/Tiger";
import StatusPanel from "../prefabs/StatusPanel";
import { shuffle } from "../utils/shuffle";
import { delay } from "../utils/delay";

type GameState =
  "loading" | "ready" | "animating" | "resetting" | "won" | "error";

export default class Game extends Container {
  readonly designWidth: number;
  readonly designHeight: number;

  private readonly loader = new AssetLoader();
  private readonly fadeOverlay = new Graphics();
  private readonly backgroundMusic: HTMLAudioElement;
  private readonly openingAnimations = new Set<Promise<void>>();

  private cage!: Cage;
  private tiger!: Tiger;
  private panel!: StatusPanel;
  private victoryText!: Sprite;

  private victoryScale = 1;
  private state: GameState = "loading";
  private code: number[] = [];
  private progress = 0;

  constructor(private readonly config: GameConfig) {
    super();

    this.designWidth = config.designWidth;
    this.designHeight = config.designHeight;
    this.backgroundMusic = new Audio(config.backgroundMusicUrl);
  }

  private hasGameError(): boolean {
    return this.state === "error";
  }

  async load(): Promise<void> {
    try {
      await this.loader.load(this.config.assets);

      this.createScene();
      this.startAttempt();
      this.setupBackgroundMusic();
    } catch (error) {
      this.showError(error);
    }
  }

  private createScene(): void {
    const scene = this.config.scene;

    // Background.
    const background = new Sprite(this.loader.getTexture("background"));

    const backgroundScale = Math.max(
      this.designWidth / background.texture.width,
      this.designHeight / background.texture.height,
    );

    background.anchor.set(0.5);
    background.scale.set(backgroundScale);
    background.position.set(this.designWidth / 2, this.designHeight / 2);
    background.eventMode = "none";

    this.addChild(background);

    // Cage and locking bars.
    this.cage = new Cage(
      this.loader.getTexture("cage"),
      this.loader.getTexture("bar"),
      this.loader.getTexture("barShadow"),
      this.config.cage,
      this.config.bar,
    );

    this.cage.position.set(scene.cage.x, scene.cage.y);
    this.cage.scale.set(scene.cage.scale);
    this.cage.setInteractive(false);

    this.addChild(this.cage);

    // Tiger behind the bars.
    this.tiger = new Tiger(this.loader.getTexture("tiger"), this.config.tiger);

    this.tiger.position.set(scene.tiger.x, scene.tiger.y);

    this.cage.addChildAt(this.tiger, scene.tiger.cagedLayerIndex);

    // Plate and panel share the same position.
    const plate = new Sprite(this.loader.getTexture("plate"));

    plate.anchor.set(0.5);
    plate.scale.set(scene.statusArea.plateWidth / plate.texture.width);
    plate.position.set(scene.statusArea.x, scene.statusArea.y);
    plate.eventMode = "none";

    this.addChild(plate);

    this.panel = new StatusPanel(
      this.config.cage.barNumbers.length,
      this.config.statusPanel,
    );

    this.panel.position.set(scene.statusArea.x, scene.statusArea.y);
    this.panel.scale.set(scene.statusArea.panelScale);

    this.addChild(this.panel);

    // Victory artwork.
    this.victoryText = new Sprite(this.loader.getTexture("txt"));

    this.victoryScale =
      this.config.victoryWidth / this.victoryText.texture.width;

    this.victoryText.anchor.set(0.5);
    this.victoryText.scale.set(this.victoryScale);
    this.victoryText.position.set(scene.victory.x, scene.victory.y);
    this.victoryText.visible = false;
    this.victoryText.eventMode = "none";

    this.addChild(this.victoryText);

    // Transition overlay.
    this.fadeOverlay.beginFill(this.config.fadeColor);
    this.fadeOverlay.drawRect(0, 0, this.designWidth, this.designHeight);
    this.fadeOverlay.endFill();

    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = false;
    this.fadeOverlay.eventMode = "static";

    this.addChild(this.fadeOverlay);

    this.cage.on("selected", (barNumber: number) => {
      void this.handleSelection(barNumber);
    });
  }

  private setupBackgroundMusic(): void {
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = this.config.musicVolume;

    void this.backgroundMusic.play().catch((error: unknown) => {
      if (this.hasGameError()) {
        return;
      }

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        window.addEventListener("pointerdown", this.startBackgroundMusic, {
          once: true,
        });

        return;
      }

      console.warn("Background music could not start:", error);
    });
  }

  private readonly startBackgroundMusic = (): void => {
    if (this.hasGameError()) {
      return;
    }

    void this.backgroundMusic.play().catch((error: unknown) => {
      console.warn("Background music could not start:", error);
    });
  };

  private startAttempt(enableInput = true): void {
    this.code = shuffle(this.config.cage.barNumbers);
    this.progress = 0;

    this.panel.reset();
    this.tiger.reset();

    gsap.killTweensOf(this.victoryText);
    gsap.killTweensOf(this.victoryText.scale);

    this.victoryText.visible = false;
    this.victoryText.alpha = 1;
    this.victoryText.scale.set(this.victoryScale);

    this.cage.setChildIndex(
      this.tiger,
      this.config.scene.tiger.cagedLayerIndex,
    );

    console.log("Generated code:", this.code.join(" "));

    this.state = enableInput ? "ready" : "resetting";
    this.cage.setInteractive(enableInput);
  }

  private async handleSelection(barNumber: number): Promise<void> {
    if (this.state !== "ready") {
      return;
    }

    try {
      const expectedNumber = this.code[this.progress];

      if (barNumber !== expectedNumber) {
        await this.resetAttempt(barNumber);
        return;
      }

      // Accept the choice before awaiting its animation.
      this.progress++;
      this.panel.setRemaining(this.code.length - this.progress);
      this.trackBarOpening(barNumber);

      if (this.progress === this.code.length) {
        this.state = "animating";
        this.cage.setInteractive(false);

        await this.waitForOpeningAnimations();

        if (this.hasGameError()) {
          return;
        }

        await this.win();
        return;
      }

      // Other bars remain available while this one slides.
      this.cage.setInteractive(true);
    } catch (error) {
      this.showError(error);
    }
  }

  private trackBarOpening(barNumber: number): void {
    const animation = this.cage.openBar(barNumber).catch((error: unknown) => {
      this.showError(error);
    });

    this.openingAnimations.add(animation);

    void animation.then(() => {
      this.openingAnimations.delete(animation);
    });
  }

  private async waitForOpeningAnimations(): Promise<void> {
    while (this.openingAnimations.size > 0) {
      await Promise.all([...this.openingAnimations]);
    }
  }

  private async resetAttempt(barNumber: number): Promise<void> {
    this.state = "resetting";
    this.cage.setInteractive(false);

    // Show feedback while the previously selected bars close.
    await Promise.all([
      this.cage.showWrongSelection(barNumber),
      this.closeBarsAfterOpening(),
    ]);

    if (this.hasGameError()) {
      return;
    }

    this.startAttempt();
  }

  private async closeBarsAfterOpening(): Promise<void> {
    await this.waitForOpeningAnimations();

    if (this.hasGameError()) {
      return;
    }

    await this.cage.closeAll();
  }

  private async win(): Promise<void> {
    this.state = "won";
    this.cage.setInteractive(false);

    this.cage.setChildIndex(this.tiger, this.cage.children.length - 1);

    await this.tiger.escape();

    await Promise.all([this.showVictory(), delay(this.config.winDelaySeconds)]);

    await this.restartScene();
  }

  private async showVictory(): Promise<void> {
    const animation = this.config.victoryAnimation;

    this.victoryText.visible = true;
    this.victoryText.alpha = 0;
    this.victoryText.scale.set(
      this.victoryScale * animation.initialScaleMultiplier,
    );

    const timeline = gsap.timeline();

    timeline.to(
      this.victoryText,
      {
        alpha: 1,
        duration: animation.fadeDuration,
      },
      0,
    );

    timeline.to(
      this.victoryText.scale,
      {
        x: this.victoryScale,
        y: this.victoryScale,
        duration: animation.scaleDuration,
        ease: animation.scaleEase,
      },
      0,
    );

    await timeline;

    const pulseScale = this.victoryScale * animation.pulseScaleMultiplier;

    gsap.to(this.victoryText.scale, {
      x: pulseScale,
      y: pulseScale,
      duration: animation.pulseDuration,
      repeat: -1,
      yoyo: true,
      ease: animation.pulseEase,
    });
  }

  private async restartScene(): Promise<void> {
    this.state = "resetting";
    this.cage.setInteractive(false);

    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = true;

    await gsap.to(this.fadeOverlay, {
      alpha: 1,
      duration: this.config.fadeDuration,
      ease: this.config.fadeEase,
    });

    await this.cage.closeAll();
    this.startAttempt(false);

    await gsap.to(this.fadeOverlay, {
      alpha: 0,
      duration: this.config.fadeDuration,
      ease: this.config.fadeEase,
    });

    this.fadeOverlay.visible = false;
    this.state = "ready";
    this.cage.setInteractive(true);
  }

  private showError(error: unknown): void {
    if (this.hasGameError()) {
      return;
    }

    this.state = "error";
    this.cage?.setInteractive(false);
    this.backgroundMusic.pause();

    window.removeEventListener("pointerdown", this.startBackgroundMusic);

    gsap.killTweensOf(this.fadeOverlay);
    this.fadeOverlay.visible = false;

    if (this.victoryText) {
      gsap.killTweensOf(this.victoryText);
      gsap.killTweensOf(this.victoryText.scale);
    }

    console.error("Game failed:", error);

    const message = new Text(
      this.config.errorMessage.text,
      this.config.errorMessage.style,
    );

    message.anchor.set(0.5);
    message.position.set(this.designWidth / 2, this.designHeight / 2);
    message.eventMode = "none";

    this.addChild(message);
  }
}
