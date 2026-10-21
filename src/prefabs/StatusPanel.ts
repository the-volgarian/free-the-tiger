import { Container, Text, TextStyle } from "pixi.js";

const TOTAL_BARS = 6;

export default class StatusPanel extends Container {
  private readonly countText: Text;
  private remaining = TOTAL_BARS;

  constructor() {
    super();

    const textStyle = new TextStyle({
      fontFamily: ["Arial Black", "Arial", "sans-serif"],
      fontSize: 38,
      fontWeight: "bold",
      align: "center",
      fill: 0xfff4cf,

      stroke: 0x071b20,
      strokeThickness: 6,
      lineJoin: "round",

      dropShadow: true,
      dropShadowColor: 0x003c46,
      dropShadowAlpha: 0.7,
      dropShadowAngle: Math.PI / 2,
      dropShadowDistance: 6,
      dropShadowBlur: 0,
    });

    const titleStyle = textStyle.clone();
    titleStyle.fontSize = 55;

    const title = new Text("FREE THE\nTIGER", titleStyle);
    title.anchor.set(0.5);
    title.position.set(0, -175);

    const countStyle = textStyle.clone();
    countStyle.fontSize = 240;
    countStyle.fill = [0xffed60, 0xffb526];
    countStyle.strokeThickness = 8;
    countStyle.dropShadowDistance = 9;

    this.countText = new Text(String(this.remaining), countStyle);
    this.countText.anchor.set(0.5);
    this.countText.position.set(0, 0);

    const caption = new Text("BARS LEFT", textStyle);
    caption.anchor.set(0.5);
    caption.position.set(0, 145);

    const instructionStyle = textStyle.clone();
    instructionStyle.fontSize = 26;
    instructionStyle.strokeThickness = 4;
    instructionStyle.dropShadowDistance = 4;

    const instruction = new Text("Find the\nright order", instructionStyle);

    instruction.anchor.set(0.5);
    instruction.position.set(0, 205);

    this.addChild(title, this.countText, caption, instruction);
    this.eventMode = "none";
  }

  setRemaining(count: number): void {
    this.remaining = Math.max(0, Math.min(TOTAL_BARS, count));
    this.countText.text = String(this.remaining);
  }

  decrease(): void {
    this.setRemaining(this.remaining - 1);
  }

  reset(): void {
    this.setRemaining(TOTAL_BARS);
  }
}
