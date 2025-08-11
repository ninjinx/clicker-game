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

  it('トウモロコシの実がないとポップコーン生産できない', () => {
      // 実を0にしてから生産
      while (game.getState().cornSeedCount > 0) {
          game.plantCorn();
      }
      game.producePopcorn(1);
      expect(game.getState().popcornCount).toBe(0);
  });
  
  it('トウモロコシの実がある場合はポップコーンが生産できる', () => {
      // 実を1個残して生産
      while (game.getState().cornSeedCount > 1) {
          game.plantCorn();
      }
      const before = game.getState().popcornCount;
      game.producePopcorn(1);
      const after = game.getState().popcornCount;
      expect(after).toBe(before + game.getState().popcornEfficiency);
  });
  
  it('トウモロコシを植えると実が1個消費される', () => {
      const before = game.getState().cornSeedCount;
      game.plantCorn();
      const after = game.getState().cornSeedCount;
      expect(after).toBe(before - 1);
  });
  
  it('トウモロコシの実が0個なら植えられない', () => {
      // 実を0にしてから植える
      while (game.getState().cornSeedCount > 0) {
          game.plantCorn();
      }
      const before = game.getState().cornSeedCount;
      game.plantCorn();
      const after = game.getState().cornSeedCount;
      expect(after).toBe(before); // 消費されない
      expect(game.getState().corns.length).toBe(30); // 追加されない
  });
  
  it('植えた後、残量表示が更新される', () => {
      const dom = createMockDOM();
      const game2 = setupGame(dom, () => {});
      const before = dom.getElementById('corn-count').textContent;
      game2.plantCorn();
      const after = dom.getElementById('corn-count').textContent;
      expect(after).not.toBe(before);
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