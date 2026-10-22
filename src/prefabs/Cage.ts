import { Container, Sprite, Texture } from "pixi.js";
import Bar from "./Bar";

const TOTAL_BARS = 6;
const BARS_PER_SIDE = 3;

const CAGE_WIDTH = 760;
const BAR_WIDTH_RATIO = 0.34;

type CageLayout = {
  leftX: number;
  rightX: number;
  firstY: number;
  rowSpacing: number;
};

export default class Cage extends Container {
  private readonly bars: Bar[] = [];

  constructor(
    cageTexture: Texture,
    barTexture: Texture,
    shadowTexture: Texture,
    layout: CageLayout,
  ) {
    super();

    // Create cage
    const image = new Sprite(cageTexture);
    image.anchor.set(0.5);
    image.eventMode = "none";

    // Scale cage while preserving aspect ratio
    const fitImage = () => {
      const scale = CAGE_WIDTH / image.texture.width;
      image.scale.set(scale);
    };

    if (image.texture.baseTexture.valid) {
      fitImage();
    } else {
      image.texture.baseTexture.once("loaded", fitImage);
    }

    this.addChild(image);

    // Calculate bar dimensions relative to cage width
    const barWidth = CAGE_WIDTH * BAR_WIDTH_RATIO;
    const barScale = barWidth / barTexture.width;

    // Create bars
    for (let index = 0; index < TOTAL_BARS; index++) {
      const isLeft = index < BARS_PER_SIDE;
      const row = index % BARS_PER_SIDE;

      const bar = new Bar(
        index + 1,
        barTexture,
        isLeft ? "left" : "right",
        shadowTexture,
      );

      // Position bar
      bar.position.set(
        isLeft ? layout.leftX : layout.rightX,
        layout.firstY + row * layout.rowSpacing,
      );

      // Scale only the bar image and shadow
      bar.setBarScale(barScale);

      // Forward selection event
      bar.on("selected", (barNumber: number) => {
        this.emit("selected", barNumber);
      });

      this.bars.push(bar);
      this.addChild(bar);
    }
  }

  async openBar(barNumber: number): Promise<void> {
    const bar = this.bars.find(
      (currentBar) => currentBar.barNumber === barNumber,
    );

    if (!bar) {
      throw new Error(`Bar ${barNumber} does not exist.`);
    }

    await bar.open();
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