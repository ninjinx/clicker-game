import { describe, it, expect, beforeEach } from 'vitest';
import { setupGame, GameDOM } from '../script';
import * as fs from 'fs';
import * as path from 'path';

function createMockDOM(): GameDOM {
  const elements: Record<string, any> = {};
  [
    'corn-list', 'corn-button', 'corn-count',
    'popcorn-count', 'popcorn-total', 'popcorn-sold',
    'popcorn-efficiency', 'batch-size', 'produce-popcorn-btn',
    'popcorn-history', 'sell-popcorn-btn', 'popcorn-machine'
  ].forEach(id => {
    const dummy = {
      id,
      innerHTML: '',
      textContent: '',
      value: '1',
      classList: { add() {}, remove() {} } as DOMTokenList,
      appendChild: (_c: any) => {},
      removeChild: (_c: any) => {},
      setAttribute: () => {},
    };
    elements[id] = dummy as unknown as HTMLElement;
  });
  return {
    getElementById: (id: string) => elements[id],
    createElement: (tag: string) => {
      const dummy = {
        tag,
        style: {},
        setAttribute: () => {},
        appendChild: (_c: any) => {},
        removeChild: (_c: any) => {},
      };
      return dummy as unknown as HTMLElement;
    },
    querySelectorAll: (_selector: string) => {
      const arr: HTMLElement[] = [];
      (arr as any).item = (i: number) => arr[i];
      return arr as unknown as NodeListOf<HTMLElement>;
    },
  };
}

describe('ポップコーンメーカーゲーム', () => {
  let game: ReturnType<typeof setupGame>;
  let dom: GameDOM;

  beforeEach(() => {
    dom = createMockDOM();
    game = setupGame(dom, () => {});
  });

  it('トウモロコシを植えるとリストが増える', () => {
    game.plantCorn();
    expect(game.getState().corns.length).toBe(1);
  });

  it('成熟トウモロコシがないとポップコーン生産できない', () => {
    game.producePopcorn(1);
    expect(game.getState().popcornCount).toBe(0);
  });

// 画像リソースが存在するかチェックするテスト
describe('画像リソースが存在する', () => {
  it('images/popcorn.png ファイルが存在すること', () => {
    const imgPath = path.join(__dirname, '../images/popcorn.png');
    const exists = fs.existsSync(imgPath);
    expect(exists).toBe(true);
    if (!exists) {
      // テスト失敗時に明確なメッセージを表示
      throw new Error('画像データが必要です: images/popcorn.png をプロジェクトに追加してください。');
    }
  });
});
});