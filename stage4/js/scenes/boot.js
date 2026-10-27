import { hiDpi } from '../config.js?v=1';
import { paintAll } from '../art.js?v=1';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    hiDpi(this);
    paintAll(this);
    this.scene.start('title');
  }
}
