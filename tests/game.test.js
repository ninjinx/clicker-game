import { describe, it, expect, beforeEach } from 'vitest';
import { setupGame } from '../script.js';

function createMockDOM() {
  // 必要な要素だけ簡易モック
  const elements = {};
  [
    'corn-list', 'corn-button', 'corn-count',
    'popcorn-count', 'popcorn-total', 'popcorn-sold',
    'popcorn-efficiency', 'batch-size', 'produce-popcorn-btn',
    'popcorn-history', 'sell-popcorn-btn', 'popcorn-machine'
  ].forEach(id => {
    elements[id] = { id, innerHTML: '', textContent: '', value: '1', classList: { add() {}, remove() {} }, appendChild() {}, removeChild() {} };
  });
  return {
    getElementById: id => elements[id],
    createElement: tag => ({ tag, style: {}, setAttribute() {}, appendChild() {}, removeChild() {} }),
    querySelectorAll: () => [],
  };
}

describe('ポップコーンメーカーゲーム', () => {
  let game;
  let dom;

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
});