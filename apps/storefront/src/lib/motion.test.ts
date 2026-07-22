import { describe, expect, it } from 'vitest';
import { countdownParts, shouldRunBoot, storyStage } from './motion';

describe('shouldRunBoot', () => {
  it('runs the entry animation for each new document load', () => {
    expect(shouldRunBoot(false)).toBe(true);
  });

  it('skips the entry animation when reduced motion is requested', () => {
    expect(shouldRunBoot(true)).toBe(false);
  });
});

describe('storyStage', () => {
  it('keeps every callout hidden before the sticky story reaches the viewport', () => {
    expect(storyStage({ top: 240, height: 3_400, viewportHeight: 1_000 })).toBe(0);
  });

  it('advances through the four reference stages as the sticky scene scrolls', () => {
    expect(storyStage({ top: 0, height: 3_400, viewportHeight: 1_000 })).toBe(1);
    expect(storyStage({ top: -900, height: 3_400, viewportHeight: 1_000 })).toBe(2);
    expect(storyStage({ top: -1_600, height: 3_400, viewportHeight: 1_000 })).toBe(3);
    expect(storyStage({ top: -2_400, height: 3_400, viewportHeight: 1_000 })).toBe(4);
  });

  it('clamps the story stage after the sequence completes', () => {
    expect(storyStage({ top: -9_000, height: 3_400, viewportHeight: 1_000 })).toBe(4);
  });
});

describe('countdownParts', () => {
  it('formats the remaining duration using the prototype clock fields', () => {
    expect(countdownParts(100_000_000, 0)).toEqual({
      days: '01',
      hours: '03',
      minutes: '46',
      seconds: '40',
    });
  });

  it('never renders a negative countdown', () => {
    expect(countdownParts(1_000, 2_000)).toEqual({
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    });
  });
});
