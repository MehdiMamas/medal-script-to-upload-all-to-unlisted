(async () => {
  const SCROLL_SELECTOR =
    '#app > div > div > div.absolute.top-\\[60px\\].right-0.bottom-0.left-0.flex.flex-col > div > div > div.next-to-sidebar.flex.min-w-0.flex-1.flex-col > div > div > div > div > div.relative.flex-1 > div > div';
  const POLL_INTERVAL = 500;
  const UPLOAD_TIMEOUT = 15 * 60 * 1000; // 15 min per clip
  const SETTLE_DELAY = 1000;
  const MAX_SCROLL_RETRIES = 5;

  const processed = new Set();
  let totalUploaded = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = (fn, timeout = 30000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        const result = fn();
        if (result) return resolve(result);
        if (Date.now() - start > timeout) return reject(new Error('waitFor timed out'));
        setTimeout(check, POLL_INTERVAL);
      };
      check();
    });

  const simClick = (el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      el.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })
      );
    }
  };

  const sendEscape = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })
    );
  };

  const getOnDeviceClips = () => {
    const cards = document.querySelectorAll('[data-library-item="true"]');
    const results = [];
    for (const card of cards) {
      const contentId = card.querySelector('[data-content-id]')?.getAttribute('data-content-id');
      if (!contentId || processed.has(contentId)) continue;
      if (card.querySelector('[data-shape="on-device"]')) {
        results.push({ card, contentId });
      }
    }
    return results;
  };

  const findPostButtonInPreview = () => {
    const preview = document.querySelector('[data-testid="preview-modal"]');
    if (!preview) return null;
    const postIcon = preview.querySelector('[data-shape="post"]');
    return postIcon?.closest('button');
  };

  const findConfirmPostButton = () => {
    const preview = document.querySelector('[data-testid="preview-modal"]');
    if (!preview) return null;
    const buttons = preview.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.trim();
      if (text === 'Post' && !btn.querySelector('[data-shape="post"]')) {
        return btn;
      }
    }
    return null;
  };

  const closePreviewModal = async () => {
    sendEscape();
    await sleep(300);
    const backdrop = document.querySelector('#clip-preview-modal-new');
    if (backdrop && !backdrop.classList.contains('hidden')) {
      simClick(backdrop);
      await sleep(300);
      sendEscape();
    }
    try {
      await waitFor(
        () => {
          const modal = document.querySelector('[data-testid="preview-modal"]');
          return !modal || modal.style.display === 'none' || modal.closest('.hidden');
        },
        5000
      );
    } catch {
      const backdrop2 = document.querySelector('#clip-preview-modal-new');
      if (backdrop2) {
        backdrop2.classList.add('hidden');
        backdrop2.style.display = '';
      }
    }
  };

  const uploadClip = async (card, contentId, index) => {
    const clipStart = Date.now();
    console.log(`[${index}] Starting upload for clip ${contentId}`);

    const thumb = card.querySelector('[class*="aspect-16"]') || card.querySelector('.thumbnail-image')?.parentElement;
    if (!thumb) throw new Error('Could not find thumbnail to click');

    simClick(thumb);
    console.log(`[${index}] Clicked thumbnail, waiting for preview modal...`);

    await waitFor(() => {
      const m = document.querySelector('[data-testid="preview-modal"]');
      return m && m.style.display !== 'none';
    }, 10000);
    await sleep(SETTLE_DELAY);

    const postBtn = await waitFor(findPostButtonInPreview, 10000);
    simClick(postBtn);
    console.log(`[${index}] Clicked Post button, waiting for confirm...`);
    await sleep(SETTLE_DELAY);

    const confirmBtn = await waitFor(findConfirmPostButton, 10000);
    simClick(confirmBtn);
    console.log(`[${index}] Clicked confirm Post, waiting for upload to complete...`);

    await waitFor(() => document.querySelector('[data-testid="overlay-modal"]'), UPLOAD_TIMEOUT);
    const elapsed = ((Date.now() - clipStart) / 1000).toFixed(1);
    console.log(`[${index}] Upload complete in ${elapsed}s`);
    await sleep(500);

    const closeBtn = document.querySelector(
      '[data-testid="overlay-modal"] [data-testid="close-button"]'
    );
    if (closeBtn) {
      simClick(closeBtn);
      console.log(`[${index}] Closed share dialog`);
    }
    await sleep(SETTLE_DELAY);

    await closePreviewModal();
    console.log(`[${index}] Closed preview modal`);
    await sleep(SETTLE_DELAY);
  };

  const scrollContainer = document.querySelector(SCROLL_SELECTOR);
  if (!scrollContainer) {
    console.error('Could not find scroll container. Verify the selector.');
    return;
  }

  console.log('=== Medal On-Device Clip Uploader ===');
  console.log('Scroll container found. Starting...\n');

  let scrollRetries = 0;
  let clipIndex = 1;

  while (true) {
    await sleep(500);
    const clips = getOnDeviceClips();

    if (clips.length > 0) {
      scrollRetries = 0;
      const { card, contentId } = clips[0];
      try {
        await uploadClip(card, contentId, clipIndex);
        processed.add(contentId);
        totalUploaded++;
        clipIndex++;
      } catch (err) {
        console.error(`[${clipIndex}] Failed on clip ${contentId}: ${err.message}`);
        processed.add(contentId);
        totalFailed++;
        clipIndex++;
        try { await closePreviewModal(); } catch {}
        await sleep(2000);
      }
      continue;
    }

    const prevScroll = scrollContainer.scrollTop;
    scrollContainer.scrollBy({ top: 600, behavior: 'smooth' });
    await sleep(1500);

    if (scrollContainer.scrollTop <= prevScroll) {
      scrollRetries++;
      console.log(`No new clips after scroll (attempt ${scrollRetries}/${MAX_SCROLL_RETRIES})`);
      if (scrollRetries >= MAX_SCROLL_RETRIES) break;
      await sleep(2000);
    } else {
      scrollRetries = 0;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n=== DONE ===');
  console.log(`Uploaded: ${totalUploaded}`);
  console.log(`Failed:   ${totalFailed}`);
  console.log(`Total time: ${totalTime} min`);
})();