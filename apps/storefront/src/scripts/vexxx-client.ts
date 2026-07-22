import { parseAccessRequest } from '../lib/access';
import { countdownParts, shouldRunBoot, storyStage } from '../lib/motion';

function revealVisibleElements(): void {
  const viewportHeight = window.innerHeight;
  document.querySelectorAll<HTMLElement>('[data-reveal]:not(.vx-on)').forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < viewportHeight * 0.92 && rect.bottom > -20) {
      element.classList.add('vx-on');
    }
  });
}

function initializeBoot(reducedMotion: boolean): void {
  const boot = document.querySelector<HTMLElement>('[data-boot-screen]');
  if (!boot) return;

  if (!shouldRunBoot(reducedMotion)) {
    boot.hidden = true;
    return;
  }

  document.body.classList.add('overlay-open');
  window.setTimeout(() => boot.classList.add('boot-screen--leaving'), 1_550);
  window.setTimeout(() => {
    boot.hidden = true;
    document.body.classList.remove('overlay-open');
  }, 2_050);
}

function initializeCursor(reducedMotion: boolean): void {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const cursor = document.querySelector<HTMLElement>('[data-vx-cursor]');
  const dot = document.querySelector<HTMLElement>('[data-vx-cursor-dot]');
  const tag = document.querySelector<HTMLElement>('[data-vx-cursor-tag]');
  if (!finePointer || reducedMotion || !cursor || !dot || !tag) return;

  document.body.classList.add('vx-nocursor');
  cursor.hidden = false;
  let x = 0;
  let y = 0;
  let frame: number | undefined;

  document.addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    });
  });

  document.addEventListener('mouseover', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-cursor]')
      : null;

    if (target) {
      dot.classList.add('vx-cursor__dot--active');
      tag.textContent = target.dataset.cursor ?? '';
      tag.classList.add('vx-cursor__tag--active');
      return;
    }

    dot.classList.remove('vx-cursor__dot--active');
    tag.classList.remove('vx-cursor__tag--active');
  });
}

function initializeDragScroll(): void {
  document.addEventListener('pointerdown', (event) => {
    const scroller = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-hscroll]')
      : null;
    if (!scroller) return;

    const startX = event.clientX;
    const startLeft = scroller.scrollLeft;
    scroller.classList.add('vx-dragging');

    const move = (moveEvent: PointerEvent): void => {
      scroller.scrollLeft = startLeft - (moveEvent.clientX - startX);
    };
    const stop = (): void => {
      scroller.classList.remove('vx-dragging');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  });
}

function updateScrollEffects(reducedMotion: boolean): void {
  const scrollY = window.scrollY;
  const nav = document.querySelector<HTMLElement>('[data-vx-nav]');
  const emblem = document.querySelector<HTMLElement>('[data-vx-emb]');
  const story = document.querySelector<HTMLElement>('[data-vx-story]');

  if (nav) {
    nav.style.background = scrollY > 40 ? 'rgba(5,5,5,.88)' : 'rgba(5,5,5,.55)';
  }
  if (emblem && !reducedMotion) {
    emblem.style.transform = `translateY(${scrollY * 0.12}px)`;
  }
  if (story) {
    const rect = story.getBoundingClientRect();
    const stage = storyStage({
      top: rect.top,
      height: rect.height,
      viewportHeight: window.innerHeight,
    });
    story.dataset.storyStage = String(stage);

    const progressLabel = story.querySelector<HTMLElement>('[data-story-progress-label]');
    const progressBar = story.querySelector<HTMLElement>('[data-story-progress-bar]');
    const image = story.querySelector<HTMLElement>('[data-story-image]');
    if (progressLabel) progressLabel.textContent = `0${stage} / 04`;
    if (progressBar) progressBar.style.height = `${stage * 25}%`;
    if (image && !reducedMotion) image.style.transform = `scale(${1 + stage * 0.012})`;
  }

  revealVisibleElements();
}

function initializeScrollEffects(reducedMotion: boolean): void {
  let frame: number | undefined;
  const update = (): void => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      updateScrollEffects(reducedMotion);
    });
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  updateScrollEffects(reducedMotion);
  window.setTimeout(revealVisibleElements, 60);
  window.setTimeout(revealVisibleElements, 450);
}

function initializeCountdowns(): void {
  document.querySelectorAll<HTMLElement>('[data-countdown]').forEach((countdown) => {
    const targetValue = countdown.dataset.target;
    const target = targetValue ? Date.parse(targetValue) : Number.NaN;
    if (!Number.isFinite(target)) return;

    const write = (): void => {
      const parts = countdownParts(target, Date.now());
      const values: readonly (readonly [string, string])[] = [
        ['[data-days]', parts.days],
        ['[data-hours]', parts.hours],
        ['[data-minutes]', parts.minutes],
        ['[data-seconds]', parts.seconds],
      ];
      values.forEach(([selector, value]) => {
        const element = countdown.querySelector<HTMLElement>(selector);
        if (element) element.textContent = value;
      });
    };

    write();
    window.setInterval(write, 1_000);
  });
}

function flash(message: string): void {
  const toast = document.querySelector<HTMLElement>('[data-system-toast]');
  if (!toast) return;

  toast.textContent = `● ${message}`;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 2_400);
}

function initializeAccessForms(): void {
  document.querySelectorAll<HTMLFormElement>('[data-access-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.querySelector<HTMLInputElement>('[data-access-email]');
      const submit = form.querySelector<HTMLButtonElement>('[data-access-submit]');
      const success = form.parentElement?.querySelector<HTMLElement>('[data-access-success]');
      if (!input || !submit || !success) return;

      const request = parseAccessRequest({ email: input.value });
      if (!request) {
        flash(form.dataset.invalidMessage ?? 'INVALID ID');
        input.focus();
        return;
      }

      input.value = request.email;
      submit.disabled = true;
      submit.textContent = form.dataset.validatingLabel ?? submit.textContent;
      window.setTimeout(() => {
        form.hidden = true;
        success.hidden = false;
      }, 900);
    });
  });
}

export function initializeVexxxClient(): void {
  if (document.documentElement.dataset.vexxxClient === 'ready') return;
  document.documentElement.dataset.vexxxClient = 'ready';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  initializeBoot(reducedMotion);
  initializeCursor(reducedMotion);
  initializeDragScroll();
  initializeScrollEffects(reducedMotion);
  initializeCountdowns();
  initializeAccessForms();
}
