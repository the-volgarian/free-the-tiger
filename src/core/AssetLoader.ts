import { Assets, Texture } from "pixi.js";

export default class AssetLoader {
  private readonly textures = new Map<string, Texture>();

  async load(images: Record<string, string>): Promise<void> {
    for (const [name, url] of Object.entries(images)) {
      try {
        const texture = await Assets.load<Texture>(url);

        this.textures.set(name, texture);
      } catch (error) {
        throw new Error(`Failed to load image "${name}" from "${url}".`, {
          cause: error,
        });
      }
    }
  }

  getTexture(name: string): Texture {
    const texture = this.textures.get(name);

    if (!texture) {
      throw new Error(`Texture "${name}" has not been loaded.`);
    }

    return texture;
  }
}
