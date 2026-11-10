# Contributing

Thanks for helping out. This project is one file, `script.js`, pasted into the browser console on the Medal library page.

## Making a change

1. Fork the repo and create a branch.
2. Edit `script.js`. Keep it a single self-contained script with no dependencies.
3. Check the syntax: `node --check script.js`.
4. Test it on your own Medal library (a few on-device clips is enough) and paste the console output in the PR.
5. Open a pull request describing what changed and why.

## Medal UI changes

Most breakage comes from Medal changing its markup. If the script stops with a missing element, open an issue with the console error and, if you can, the new selector from DevTools.

## Ground rules

- Only run the script on your own account.
- Be kind in issues and reviews.
