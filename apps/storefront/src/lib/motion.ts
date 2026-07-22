export interface StoryGeometry {
  top: number;
  height: number;
  viewportHeight: number;
}

export type StoryStage = 0 | 1 | 2 | 3 | 4;

export interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export function shouldRunBoot(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

export function storyStage({ top, height, viewportHeight }: StoryGeometry): StoryStage {
  if (top > 0) return 0;

  const total = Math.max(1, height - viewportHeight);
  const progress = Math.min(1, Math.max(0, -top / total));
  const stage = Math.min(4, Math.max(1, Math.ceil(progress * 4.2)));
  return stage as StoryStage;
}

export function countdownParts(target: number, now: number): CountdownParts {
  const remaining = Math.max(0, target - now);
  return {
    days: pad(Math.floor(remaining / 86_400_000)),
    hours: pad(Math.floor(remaining / 3_600_000) % 24),
    minutes: pad(Math.floor(remaining / 60_000) % 60),
    seconds: pad(Math.floor(remaining / 1_000) % 60),
  };
}
