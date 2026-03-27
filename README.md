# TúraPest

A self-contained, browser-based city treasure hunt game. Players walk a route through Budapest, solving riddles written in verse to unlock the next clue. Works on desktop and mobile, and can be installed as a PWA for offline use.

## How it works

The page shows all riddles at once, each with an answer input field. Riddles are initially displayed in encrypted (scrambled) form. When the player types the correct answer, the next riddle smoothly decrypts in real time, letter by letter. A wrong answer produces a different (still scrambled) result.

There is no server, no login, and no progress tracking — the game is entirely stateless. If the page is reloaded, answers need to be re-entered.

## Cipher

Each riddle text is encrypted with a simple rotation cipher keyed on the MD5 hash of the correct answer (uppercased). The cipher alphabet includes the Latin letters a–z, A–Z, digits 0–9, the Hungarian accented letters, and a set of punctuation characters. Characters outside this alphabet pass through unchanged, giving ciphertext a natural noise-like appearance.

The decryption animation steps each character one position at a time towards its target, giving the feel of a lock tumbling open.

## Deployment

The game is a set of static files — drop them on any web server or open `index.html` directly in a browser.

```
index.html        main page
quest.css         styles
quest.js          cipher logic and UI
service-worker.js PWA offline caching
manifest.json     PWA metadata
icons/            app icons (PNG + SVG)
```

No build step, no package manager, no backend.

## Dependencies (all CDN, cached by service worker)

| Library                                                     | Purpose                    |
|-------------------------------------------------------------|----------------------------|
| [jQuery 3.4.1](https://jquery.com/)                         | DOM manipulation           |
| [JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5) | Key hashing for the cipher |
| [Inconsolata + Roboto Mono](https://fonts.google.com/)      | Typography                 |

## PWA / offline support

A service worker caches all required files (HTML, CSS, JS, fonts) on first load. After that the game works without a network connection. On supported browsers an install prompt appears (floating button, bottom-right corner) to add the app to the home screen.

## Adapting the game for a different route

1. **Write your riddles.** Each riddle is a `<p class="riddle">` element followed by an `<input class="input-field">` with the `maxlength` set to the number of characters in the answer. For answers with spaces, add a `data-spaces` attribute listing the positions of the spaces as a comma-separated list of indices (e.g. `data-spaces="6"` inserts a space after the 6th letter).

2. **Encrypt each riddle text.** Use the `encode(plain, key)` function in `quest.js` from the browser console:
   ```js
   encode("Your riddle text here", "ANSWER")
   ```
   Paste the result into the `data-cipher` attribute of the riddle element.

3. **Leave the first riddle unencrypted.** It uses `<span class="text">` directly, so it is always visible as the starting prompt.

4. **Update `manifest.json`** and the `<title>` in `index.html` with your game's name.

5. **Bump `CACHE_NAME`** in `service-worker.js` (e.g. `files_v10`) to force clients to fetch the updated files.

## Project structure note

`tervezes.txt` contains the original plain-text riddles and route planning notes in Hungarian, and serves as the authoring source for the encrypted content in `index.html`. It is not used by the game itself.
