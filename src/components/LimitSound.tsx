import { Sound } from "@babylonjs/core";

const soundIntervalMap: { [key: string]: number } = {};
const soundDateMap: { [key: string]: Date } = {};

export class LimitSound {
  private sound: Sound;

  constructor(sound: Sound, limitInterval: number) {
    this.sound = sound;
    if (!soundIntervalMap[sound.name]) {
      soundIntervalMap[sound.name] = limitInterval;
    } else {
      soundIntervalMap[sound.name] = Math.min(
        soundIntervalMap[sound.name],
        limitInterval
      );
    }
    if (!soundDateMap[sound.name]) {
      soundDateMap[sound.name] = new Date();
    }
  }

  public play() {
    const now = new Date();
    const diff = now.getTime() - soundDateMap[this.sound.name].getTime();
    if (diff < soundIntervalMap[this.sound.name]) {
      return;
    }
    soundDateMap[this.sound.name] = now;
    this.sound.play();
  }
}
