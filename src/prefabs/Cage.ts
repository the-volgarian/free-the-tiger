import { Container, Sprite, Texture } from "pixi.js";
import type { BarConfig, CageConfig } from "../config";
import Bar from "./Bar";

export default class Cage extends Container {
  private readonly bars: Bar[] = [];

  constructor(
    cageTexture: Texture,
    barTexture: Texture,
    shadowTexture: Texture,
    config: CageConfig,
    barConfig: BarConfig,
  ) {
    super();

    // Textures have already been loaded by AssetLoader.
    const image = new Sprite(cageTexture);
    image.anchor.set(0.5);
    image.eventMode = "none";
    image.scale.set(config.width / cageTexture.width);

    this.addChild(image);

    const barWidth = config.width * config.barWidthRatio;
    const barScale = barWidth / barTexture.width;

    for (const [index, barNumber] of config.barNumbers.entries()) {
      const isLeft = index < config.barsPerSide;
      const row = index % config.barsPerSide;

      const bar = new Bar(
        barNumber,
        barTexture,
        isLeft ? "left" : "right",
        shadowTexture,
        barConfig,
      );

      bar.position.set(
        isLeft ? config.layout.leftX : config.layout.rightX,
        config.layout.firstY + row * config.layout.rowSpacing,
      );

      bar.setBarScale(barScale);

      bar.on("selected", (selectedBarNumber: number) => {
        this.emit("selected", selectedBarNumber);
      });

      this.bars.push(bar);
      this.addChild(bar);
    }
  }

  private getBar(barNumber: number): Bar {
    const bar = this.bars.find(
      (currentBar) => currentBar.barNumber === barNumber,
    );

    if (!bar) {
      throw new Error(`Bar ${barNumber} does not exist.`);
    }

    return bar;
  }

  async openBar(barNumber: number): Promise<void> {
    await this.getBar(barNumber).open();
  }

  async showWrongSelection(barNumber: number): Promise<void> {
    await this.getBar(barNumber).showWrongSelection();
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.bars.map((bar) => bar.close()));
  }

  setInteractive(enabled: boolean): void {
    for (const bar of this.bars) {
      bar.setInteractive(enabled);
    }
  }
}
