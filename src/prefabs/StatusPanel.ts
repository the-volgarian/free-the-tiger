import { Container, Text, TextStyle } from "pixi.js";
import type { StatusPanelConfig } from "../config";

export default class StatusPanel extends Container {
  private readonly countText: Text;
  private remaining: number;

  constructor(
    private readonly totalBars: number,
    config: StatusPanelConfig,
  ) {
    super();

    this.remaining = totalBars;

    const title = new Text(
      config.title.text,
      new TextStyle({
        ...config.baseStyle,
        ...config.title.style,
      }),
    );

    title.anchor.set(0.5);
    title.y = config.title.y;

    this.countText = new Text(
      String(this.remaining),
      new TextStyle({
        ...config.baseStyle,
        ...config.count.style,
      }),
    );

    this.countText.anchor.set(0.5);
    this.countText.y = config.count.y;

    const caption = new Text(
      config.caption.text,
      new TextStyle({
        ...config.baseStyle,
        ...config.caption.style,
      }),
    );

    caption.anchor.set(0.5);
    caption.y = config.caption.y;

    const instruction = new Text(
      config.instruction.text,
      new TextStyle({
        ...config.baseStyle,
        ...config.instruction.style,
      }),
    );

    instruction.anchor.set(0.5);
    instruction.y = config.instruction.y;

    this.addChild(title, this.countText, caption, instruction);
    this.eventMode = "none";
  }

  setRemaining(count: number): void {
    this.remaining = Math.max(0, Math.min(this.totalBars, count));
    this.countText.text = String(this.remaining);
  }

  decrease(): void {
    this.setRemaining(this.remaining - 1);
  }

  reset(): void {
    this.setRemaining(this.totalBars);
  }
}
