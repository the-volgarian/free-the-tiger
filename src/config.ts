import type { ITextStyle } from "pixi.js";

type PositionConfig = {
  x: number;
  y: number;
};

export type CageConfig = {
  barNumbers: readonly number[];
  barsPerSide: number;
  width: number;
  barWidthRatio: number;

  layout: {
    leftX: number;
    rightX: number;
    firstY: number;
    rowSpacing: number;
  };
};

export type TigerConfig = {
  displayWidth: number;
  escapeDuration: number;
  escapeScale: number;
  escapeEase: string;
  returnDuration: number;
  returnEase: string;
};

export type BarConfig = {
  shadowOffsetY: number;
  hoverScale: number;
  openDuration: number;
  closeDuration: number;
  soundUrl: string;

  wrongSelection: {
    color: number;
    ringWidth: number;
    radiusOffset: number;
    duration: number;
    scaleMultiplier: number;
    soundUrl: string;
    soundVolume: number;
  };

  badge: {
    radius: number;
    borderWidth: number;
    outlineColor: number;

    shadow: {
      color: number;
      alpha: number;
      offsetY: number;
    };

    outerColor: number;

    rim: {
      borderColor: number;
      fillColor: number;
      inset: number;
      offsetY: number;
    };

    center: {
      fillColor: number;
      inset: number;
      offsetY: number;
    };

    highlight: {
      color: number;
      alpha: number;
      offsetY: number;
      radiusX: number;
      radiusY: number;
    };

    number: {
      offsetY: number;
      style: Partial<ITextStyle>;
    };
  };
};

type PanelTextConfig = {
  text: string;
  y: number;
  style: Partial<ITextStyle>;
};

export type StatusPanelConfig = {
  baseStyle: Partial<ITextStyle>;
  title: PanelTextConfig;

  count: {
    y: number;
    style: Partial<ITextStyle>;
  };

  caption: PanelTextConfig;
  instruction: PanelTextConfig;
};

export type GameConfig = {
  designWidth: number;
  designHeight: number;
  backgroundColor: number;

  assets: Record<string, string>;
  backgroundMusicUrl: string;
  musicVolume: number;

  cage: CageConfig;
  tiger: TigerConfig;
  bar: BarConfig;
  statusPanel: StatusPanelConfig;

  scene: {
    cage: PositionConfig & {
      scale: number;
    };

    tiger: PositionConfig & {
      cagedLayerIndex: number;
    };

    statusArea: PositionConfig & {
      plateWidth: number;
      panelScale: number;
    };

    victory: PositionConfig;
  };

  victoryWidth: number;
  winDelaySeconds: number;

  victoryAnimation: {
    initialScaleMultiplier: number;
    fadeDuration: number;
    hideEase: string;
    scaleDuration: number;
    scaleEase: string;
    pulseScaleMultiplier: number;
    pulseDuration: number;
    pulseEase: string;
  };

  errorMessage: {
    text: string;
    style: Partial<ITextStyle>;
  };
};

export const GAME_CONFIG: GameConfig = {
  designWidth: 1920,
  designHeight: 1080,
  backgroundColor: 0x18252b,

  assets: {
    background: "/images/background.jpg",
    bar: "/images/bar.png",
    barShadow: "/images/barShadow.png",
    cage: "/images/cage.png",
    plate: "/images/plate.png",
    tiger: "/images/tiger.png",
    txt: "/images/txt.png",
  },

  backgroundMusicUrl: "/sounds/background.mp3",
  musicVolume: 0.2,

  cage: {
    barNumbers: [1, 2, 3, 4, 5, 6],
    barsPerSide: 3,
    width: 760,
    barWidthRatio: 0.34,

    layout: {
      leftX: -150,
      rightX: 150,
      firstY: -60,
      rowSpacing: 100,
    },
  },

  tiger: {
    displayWidth: 440,
    escapeDuration: 1.2,
    escapeScale: 1.8,
    escapeEase: "back.out(1.2)",
    returnDuration: 0.8,
    returnEase: "power2.inOut",
  },

  bar: {
    shadowOffsetY: 8,
    hoverScale: 1.2,
    openDuration: 0.5,
    closeDuration: 0.2,
    soundUrl: "/sounds/barOpen.mp3",

    wrongSelection: {
      color: 0xff3535,
      ringWidth: 4,
      radiusOffset: 5,
      duration: 0.35,
      scaleMultiplier: 1.3,
      soundUrl: "/sounds/wrong.mp3",
      soundVolume: 0.5,
    },

    badge: {
      radius: 27,
      borderWidth: 2,
      outlineColor: 0x071b20,

      shadow: {
        color: 0x071b20,
        alpha: 0.65,
        offsetY: 4,
      },

      outerColor: 0xb77a32,

      rim: {
        borderColor: 0xffedac,
        fillColor: 0xe9b85b,
        inset: 3,
        offsetY: -1,
      },

      center: {
        fillColor: 0x12434a,
        inset: 7,
        offsetY: -1,
      },

      highlight: {
        color: 0xffffff,
        alpha: 0.08,
        offsetY: -10,
        radiusX: 14,
        radiusY: 6,
      },

      number: {
        offsetY: -1,

        style: {
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
        },
      },
    },
  },

  statusPanel: {
    baseStyle: {
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
    },

    title: {
      text: "FREE THE\nTIGER",
      y: -175,

      style: {
        fontSize: 55,
      },
    },

    count: {
      y: 0,

      style: {
        fontSize: 240,
        fill: [0xffed60, 0xffb526],
        strokeThickness: 8,
        dropShadowDistance: 9,
      },
    },

    caption: {
      text: "BARS LEFT",
      y: 145,
      style: {},
    },

    instruction: {
      text: "Find the\nright order",
      y: 205,

      style: {
        fontSize: 26,
        strokeThickness: 4,
        dropShadowDistance: 4,
      },
    },
  },

  scene: {
    cage: {
      x: 980,
      y: 560,
      scale: 1.35,
    },

    tiger: {
      x: 0,
      y: 210,
      cagedLayerIndex: 1,
    },

    statusArea: {
      x: 270,
      y: 530,
      plateWidth: 480,
      panelScale: 0.8,
    },

    victory: {
      x: 980,
      y: 700,
    },
  },

  victoryWidth: 1100,
  winDelaySeconds: 5,

  victoryAnimation: {
    initialScaleMultiplier: 0.5,
    fadeDuration: 0.25,
    hideEase: "power1.inOut",
    scaleDuration: 0.7,
    scaleEase: "back.out(1.7)",
    pulseScaleMultiplier: 1.04,
    pulseDuration: 0.8,
    pulseEase: "sine.inOut",
  },

  errorMessage: {
    text: "Unable to load or run the game.\nPlease reload the page.",

    style: {
      fontFamily: "Arial",
      fontSize: 32,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      align: "center",
    },
  },
};