# Medal On-Device Clip Uploader

A browser console script that posts every clip still stored on your device in the Medal library.

## Purpose

Medal keeps clips locally until you post them. Uploading a large library means opening each clip, clicking Post, confirming, waiting for the upload to finish, and closing the dialogs. This script runs that sequence for every on-device clip so the backlog can be uploaded in one pass instead of by hand.

It uses Medal’s existing Post flow on the library page. It does not change privacy, title, or other composer settings, so each clip is posted with whatever the Post dialog already uses.

## How to run

1. Open the Medal library in Chrome while logged in, with the clip grid visible.
2. Open DevTools (`F12`) and go to the Console.
3. Paste the contents of `script.js` and press Enter.
4. Leave the tab in the foreground until the console prints `=== DONE ===`.

## What it does

- Finds library cards marked on device and skips clips already handled in this run.
- Opens the preview, clicks Post, then clicks the confirm Post button.
- Waits up to 15 minutes per clip for the upload overlay, then closes the share dialog and the preview.
- Scrolls the library to load more cards, and stops after several scrolls that yield nothing new.
- On a failure, logs the clip, closes the modal, and continues with the next one.
- Prints how many uploaded, how many failed, and how long the run took.

## Limits

The selectors match Medal’s current library markup (`data-library-item`, `data-shape="on-device"`, the preview modal, and the scroll container). If Medal changes that UI, the script stops at the first missing element and prints an error. Run it only on your own account, and keep the tab open for the whole run.
