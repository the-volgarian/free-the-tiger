import { Container, Graphics, Sprite, Text } from "pixi.js";
import { gsap } from "gsap";
import AssetLoader from "../core/AssetLoader";
import Cage from "../prefabs/Cage";
import Tiger from "../prefabs/Tiger";
import StatusPanel from "../prefabs/StatusPanel";
import { shuffle } from "../utils/shuffle";
import { delay } from "../utils/delay";

type GameState =
  "loading" | "ready" | "animating" | "resetting" | "won" | "error";

const TOTAL_BARS = 6;
const WIN_DELAY_SECONDS = 5;
const FADE_DURATION = 0.4;
const VICTORY_WIDTH = 1100;
const MUSIC_VOLUME = 0.2;

export default class Game extends Container {
  readonly designWidth = 1920;
  readonly designHeight = 1080;

  private readonly loader = new AssetLoader();
  private readonly fadeOverlay = new Graphics();

  private readonly backgroundMusic = new Audio("/sounds/background.mp3");

  private cage!: Cage;
  private tiger!: Tiger;
  private panel!: StatusPanel;
  private victoryText!: Sprite;

  private victoryScale = 1;
  private state: GameState = "loading";
  private code: number[] = [];
  private progress = 0;

  async load(): Promise<void> {
    try {
      await this.loader.load({
        background: "/images/background.jpg",
        bar: "/images/bar.png",
        barShadow: "/images/barShadow.png",
        cage: "/images/cage.png",
        plate: "/images/plate.png",
        tiger: "/images/tiger.png",
        txt: "/images/txt.png",
      });

      this.createScene();
      this.startAttempt();
      this.setupBackgroundMusic();
    } catch (error) {
      this.showError(error);
    }
  }

  private createScene(): void {
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
      {
        leftX: -150,
        rightX: 150,
        firstY: -60,
        rowSpacing: 100,
      },
    );
    this.cage.position.set(980, 560);
    this.cage.scale.set(1.35);
    this.cage.setInteractive(false);

    this.addChild(this.cage);

    // Tiger behind the locking bars.
    this.tiger = new Tiger(this.loader.getTexture("tiger"), 440);

    this.tiger.position.set(0, 210);
    this.cage.addChildAt(this.tiger, 1);

    // Plate.
    const plate = new Sprite(this.loader.getTexture("plate"));

    const plateWidth = 480;

    plate.anchor.set(0.5);
    plate.scale.set(plateWidth / plate.texture.width);
    plate.position.set(270, 530);
    plate.eventMode = "none";

    this.addChild(plate);

    // Status panel.
    this.panel = new StatusPanel();
    this.panel.position.set(270, 530);
    this.panel.scale.set(0.8);

    this.addChild(this.panel);

    // Victory artwork.
    this.victoryText = new Sprite(this.loader.getTexture("txt"));

    this.victoryScale = VICTORY_WIDTH / this.victoryText.texture.width;

    this.victoryText.anchor.set(0.5);
    this.victoryText.scale.set(this.victoryScale);
    this.victoryText.position.set(980, 700);
    this.victoryText.visible = false;
    this.victoryText.eventMode = "none";

    this.addChild(this.victoryText);

    // Transition overlay above the scene.
    this.fadeOverlay.beginFill(0x000000);

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
    this.backgroundMusic.volume = MUSIC_VOLUME;

    // Try autoplay and fall back to the first user interaction.
    void this.backgroundMusic.play().catch((error: unknown) => {
      if (this.state === "error") {
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
    void this.backgroundMusic.play().catch((error: unknown) => {
      console.warn("Background music could not start:", error);
    });
  };

  private startAttempt(enableInput = true): void {
    this.code = shuffle([1, 2, 3, 4, 5, 6]);
    this.progress = 0;

    this.panel.reset();
    this.tiger.reset();

    gsap.killTweensOf(this.victoryText);
    gsap.killTweensOf(this.victoryText.scale);

    this.victoryText.visible = false;
    this.victoryText.alpha = 1;
    this.victoryText.scale.set(this.victoryScale);

    // Restore the tiger behind the bars.
    this.cage.setChildIndex(this.tiger, 1);

    console.log("Generated code:", this.code.join(" "));

    this.state = enableInput ? "ready" : "resetting";
    this.cage.setInteractive(enableInput);
  }

  private async handleSelection(barNumber: number): Promise<void> {
    if (this.state !== "ready") {
      return;
    }

    this.state = "animating";
    this.cage.setInteractive(false);

    try {
      const expectedNumber = this.code[this.progress];

      if (barNumber !== expectedNumber) {
        await this.resetAttempt();
        return;
      }

      await this.cage.openBar(barNumber);

      this.progress++;
      this.panel.setRemaining(TOTAL_BARS - this.progress);

      if (this.progress === this.code.length) {
        await this.win();
        return;
      }

      this.state = "ready";
      this.cage.setInteractive(true);
    } catch (error) {
      this.showError(error);
    }
  }

  private async resetAttempt(): Promise<void> {
    this.state = "resetting";
    this.cage.setInteractive(false);

    await this.cage.closeAll();

    this.startAttempt();
  }

  private async win(): Promise<void> {
    this.state = "won";
    this.cage.setInteractive(false);

    // Bring the tiger in front of all cage elements.
    this.cage.setChildIndex(this.tiger, this.cage.children.length - 1);

    await this.tiger.escape();

    await Promise.all([this.showVictory(), delay(WIN_DELAY_SECONDS)]);

    await this.restartScene();
  }

  private async showVictory(): Promise<void> {
    this.victoryText.visible = true;
    this.victoryText.alpha = 0;
    this.victoryText.scale.set(this.victoryScale * 0.5);

    const timeline = gsap.timeline();

    timeline.to(
      this.victoryText,
      {
        alpha: 1,
        duration: 0.25,
      },
      0,
    );

    timeline.to(
      this.victoryText.scale,
      {
        x: this.victoryScale,
        y: this.victoryScale,
        duration: 0.7,
        ease: "back.out(1.7)",
      },
      0,
    );

    await timeline;

    // Gently pulse until the next attempt.
    gsap.to(this.victoryText.scale, {
      x: this.victoryScale * 1.04,
      y: this.victoryScale * 1.04,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  private async restartScene(): Promise<void> {
    this.state = "resetting";
    this.cage.setInteractive(false);

    this.fadeOverlay.alpha = 0;
    this.fadeOverlay.visible = true;

    // Fade to black.
    await gsap.to(this.fadeOverlay, {
      alpha: 1,
      duration: FADE_DURATION,
      ease: "power1.inOut",
    });

    // Restore everything while the scene is covered.
    await this.cage.closeAll();

    this.startAttempt(false);

    // Reveal the restored scene.
    await gsap.to(this.fadeOverlay, {
      alpha: 0,
      duration: FADE_DURATION,
      ease: "power1.inOut",
    });

    this.fadeOverlay.visible = false;

    this.state = "ready";
    this.cage.setInteractive(true);
  }

  private showError(error: unknown): void {
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
      "Unable to load or run the game.\nPlease reload the page.",
      {
        fontFamily: "Arial",
        fontSize: 32,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 4,
        align: "center",
      },
    );

    message.anchor.set(0.5);

    message.position.set(this.designWidth / 2, this.designHeight / 2);

    message.eventMode = "none";

    this.addChild(message);
  }
}
