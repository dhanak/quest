const alnum =
    [...Array(26).keys()].map(x => String.fromCharCode(x + 65)).concat(
    [...Array(26).keys()].map(x => String.fromCharCode(x + 97))).concat(
    [...Array(10).keys()].map(x => String.fromCharCode(x + 48))).concat(
    "ÁÉÍÓÖŐÚÜŰáéíóöőúüű".split(''));

const keyLetters = alnum.concat([' ', '-']).map(x => x.charCodeAt(0));
const textLetters = alnum.concat('.,?!:=+-()'.split('')); // add: ' "

function sgn(v) {
    return v < 0 ? -1 : v == 0 ? 0 : 1;
}

function isValidLetter(key) {
    return keyLetters.indexOf(key) != -1;
}

function rotateChar(char, rot, d) {
    const ci = textLetters.indexOf(char);
    const ri = textLetters.indexOf(rot);
    return ci < 0 ? char : textLetters[(ci + d*ri + textLetters.length) % textLetters.length];
}

function rotateText(text, key, d) {
    key = md5(key.toUpperCase());
    var plain = "";
    for (var i = 0; i < text.length; i++) {
        plain += rotateChar(text[i], key[i % key.length], d);
    }
    return plain;
}

function decode(cipher, key) {
    return rotateText(cipher, key, 1);
}

function encode(plain, key) {
    return rotateText(plain, key, -1);
}

function stopDecryptAnimation(riddleText) {
    if (riddleText.data('timer')) {
        clearInterval(riddleText.data('timer'));
        riddleText.removeData('timer');
    }
}

function animateDecryption(riddleText, goal) {
    const curr = riddleText.html().replace(/<br>/g, '/');
    if (curr == goal) {
        stopDecryptAnimation(riddleText);
    } else {
        var newText = "";
        for (var i = 0; i < goal.length; i++) {
            if (curr[i] == goal[i]) {
                newText += curr[i];
            } else {
                const curri = textLetters.indexOf(curr[i]);
                const goali = textLetters.indexOf(goal[i]);
                newText += textLetters[curri + sgn(goali - curri)];
            }
        }
        riddleText.html(newText.replace(/\//g, '<br>'));
    }
}

function decrypt(riddle, key) {
    var riddleText = riddle.children('.text').first();
    if (riddleText.length) {
        stopDecryptAnimation(riddleText);
        const timer = setInterval(animateDecryption, 20, riddleText, decode(riddle.attr('data-cipher'), key));
        riddleText.data('timer', timer);
    }

    riddle.children('img').attr('data-blur', () => decode(riddle.attr('data-blur'), 'blur:' + key));
}

function add_spaces(word, spaces) {
    if (spaces) {
        spaces = spaces.split(',');
        for (var i = 0; i < spaces.length; i++) {
            idx = parseInt(spaces[i]);
            if (idx >= word.length)
                break;
            word = word.slice(0, idx) + ' ' + word.slice(idx);
        }
    }
    return word;
}

function fix_spaces(field, spaces) {
    field.value = add_spaces(field.value.replace(/ /g, ''), spaces);
    return field.value;
}

window.addEventListener('load', () => {
    $("input.input-field")
        .wrap("<div class='input'></div>")
        .keypress(evt => { if (!isValidLetter(evt.which)) { evt.preventDefault(); }})
        .each(function() {
            var riddle = $(this).parents('div.input').next('.riddle');
            const len = $(this).attr("maxlength");
            const spaces = $(this).attr("data-spaces");
            const len0 = len - (spaces ? spaces.split(',').length : 0);
            $(this)
                .before("<div class='input-border'>" + add_spaces("_".repeat(len0), spaces) + "</div>")
                .width(len + 'ch')
                .keyup(evt => decrypt(riddle, fix_spaces(this, spaces)));
        });
    $(".riddle[data-cipher]").append(function () {
        return "<span class='text'>" + decode($(this).attr('data-cipher'), '').replace(/\//g, '<br>') + "</span>";
    });
});

// add install button
var firstLoad = true;
window.addEventListener('beforeinstallprompt', (evt) => {
    if (!firstLoad)
        return;

    evt.preventDefault();
    var btn = $('#install');
    btn.show().click(async () => {
        await evt.prompt();
        await evt.userChoice;
        firstLoad = false;
        btn.hide();
    });
});

// add service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        var reg = await navigator.serviceWorker.register('service-worker.js');
        console.log('Service worker registered.', reg);
    });
}
