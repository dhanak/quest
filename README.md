# TúraPest

A self-contained, browser-based city treasure hunt game. Players walk a route
through Budapest, solving riddles written in verse to unlock the next clue.
Works on desktop and mobile as static HTML files.

## How it works

The route page shows all riddles at once, each with an answer input field.
Riddles are initially displayed in encrypted (scrambled) form. When the player
types the correct answer, the next riddle smoothly decrypts in real time,
letter by letter. A wrong answer produces a different scrambled result.

There is no server, no login, and no progress tracking. The game is entirely
stateless. If the page is reloaded, answers need to be re-entered.

## Cipher

Each riddle text is encrypted with a simple rotation cipher keyed on the MD5
hash of the correct answer (uppercased). The cipher alphabet includes Latin
letters, digits, Hungarian accented letters, and punctuation. Characters
outside this alphabet pass through unchanged.

The decryption animation steps each character one position at a time towards
its target, giving the feel of a lock tumbling open.

## Deployment

The game is a set of static files. Drop them on any web server or open
`index.html` directly in a browser.

```
index.html        Hungarian welcome page and quest selector
<quest>.html      quest pages
quest.css         styles
quest.js          cipher logic and UI
manifest.json     web app metadata
icons/            app icons (PNG + SVG)
```

No build step, no package manager, no backend.

## Dependencies

- [jQuery 3.4.1](https://jquery.com/) for DOM manipulation.
- [JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5) for key
  hashing.
- [Inconsolata + Roboto Mono](https://fonts.google.com/) for typography.

## Adapting the game for a different route

1. **Write your riddles.** Each riddle is a `<p class="riddle">` element
   followed by an `<input class="input-field">`.
   - For one-word answers, set `maxlength` to the answer length.
   - For answers with spaces, keep `maxlength` as the full displayed length
     including spaces, and add a `data-groups` attribute listing word lengths.

   The grouped UI behaves like one logical field while still showing separate
   word slots. `quest.js` combines the typed groups back into a spaced key for
   decryption.

2. **Encrypt each riddle text.** Use the `encode(plain, key)` function in
   `quest.js` from the browser console:
   ```js
   encode("Your riddle text here", "ANSWER")
   ```
   Paste the result into the `data-cipher` attribute of the riddle element.

3. **Leave the first riddle unencrypted.** It uses `<span class="text">`
   directly, so it is always visible as the starting prompt.

4. **Create or update the route page** as `<quest>.html`. The welcome page
   opens a route by appending `.html` to the entered quest name.

## Project structure note

`tervezes.txt` contains the original plain-text riddles and route planning
notes in Hungarian. It is not used by the game itself.
