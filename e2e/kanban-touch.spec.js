import { test, expect } from '@playwright/test';

// The ?harness=kanban route is gated behind import.meta.env.DEV and is
// dead-code-eliminated in production builds, so this test is dev-only.
test.skip(process.env.E2E_TARGET === 'preview', 'touch DnD harness is dev-only');

test('touch drag moves a kanban card to a new column and triggers status update', async ({ page }) => {
  await page.goto('/?harness=kanban');

  await expect(page.getByTestId('kanban-harness')).toBeVisible();
  await expect(page.locator('.kanban-board')).toBeVisible();

  const card = page.locator('.kanban-card').first();
  const interviewCol = page.locator('.kanban-column').nth(1);
  const rejectedCol = page.locator('.kanban-column').nth(2);

  // Card we'll drag is "Acme" (first card, status: applied)
  await expect(card).toContainText('Acme');

  const cardBox = await card.boundingBox();
  const targetBox = await rejectedCol.boundingBox();
  expect(cardBox && targetBox).toBeTruthy();

  // Inject touch dispatch helpers + an async waitForNextEffect that defers
  // a frame so React's useEffect can attach document touchmove/touchend.
  await page.evaluate(() => {
    window.__dispatch = (selectorOrDoc, type, x, y) => {
      const target = selectorOrDoc === 'document'
        ? document
        : document.querySelectorAll(selectorOrDoc)[0];
      const t = new Touch({
        identifier: 1, target, clientX: x, clientY: y,
        radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1,
      });
      target.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true, composed: true,
        touches: type === 'touchend' ? [] : [t],
        targetTouches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
      }));
    };
    window.__nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  });

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  // touchstart triggers setDraggedId; useEffect then attaches document listeners
  await page.evaluate(({ x, y }) => window.__dispatch('.kanban-card', 'touchstart', x, y), { x: startX, y: startY });
  await page.evaluate(() => window.__nextFrame());
  await page.evaluate(({ x, y }) => window.__dispatch('document', 'touchmove', x, y), { x: endX, y: endY });
  // Need another frame so React commits dragOverColumn state and the latest
  // handleTouchEnd closure (which reads dragOverColumn) is the one attached.
  await page.evaluate(() => window.__nextFrame());
  await page.evaluate(({ x, y }) => window.__dispatch('document', 'touchend', x, y), { x: endX, y: endY });

  // updateApplication is wrapped in the harness to record the last call
  await expect.poll(() => page.evaluate(() => window.__lastUpdate)).toEqual({
    id: 1,
    updates: { status: 'rejected' },
  });

  // The card should now appear inside the rejected column
  await expect(rejectedCol).toContainText('Acme');
});
