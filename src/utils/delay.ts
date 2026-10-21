import { gsap } from "gsap";

export function delay(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    gsap.delayedCall(seconds, resolve);
  });
}
