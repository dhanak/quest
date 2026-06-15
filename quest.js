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
            var idx = parseInt(spaces[i], 10);
            if (idx >= word.length)
                break;
            word = word.slice(0, idx) + ' ' + word.slice(idx);
        }
    }
    return word;
}

function parse_groups(groups) {
    if (!groups)
        return [];

    groups = groups.split(',');
    for (var i = 0; i < groups.length; i++) {
        groups[i] = parseInt(groups[i], 10);
    }
    return groups;
}

function groups_to_spaces(groups) {
    var spaces = [];
    var idx = 0;
    for (var i = 0; i < groups.length - 1; i++) {
        idx += groups[i];
        spaces.push(idx);
        idx += 1;
    }
    return spaces.join(',');
}

function sanitize_segment_text(text) {
    var clean = "";
    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        if (char == ' ')
            continue;
        if (isValidLetter(char.charCodeAt(0)))
            clean += char;
    }
    return clean;
}

function isValidSingleInputLetter(key) {
    return key != ' '.charCodeAt(0) && isValidLetter(key);
}

function sanitize_single_input_text(text) {
    var clean = "";
    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        if (isValidSingleInputLetter(char.charCodeAt(0)))
            clean += char;
    }
    return clean;
}

function build_input_guide(len) {
    return "_".repeat(len);
}

function focus_segment(field, atEnd) {
    var pos = atEnd ? field.value.length : 0;
    field.focus();
    field.setSelectionRange(pos, pos);
}

function first_incomplete_segment(segments) {
    for (var i = 0; i < segments.length; i++) {
        var segment = segments.eq(i);
        var max = parseInt(segment.attr("maxlength"), 10);
        if (segment.val().length < max)
            return i;
    }
    return segments.length - 1;
}

function total_group_length(groups) {
    var total = 0;
    for (var i = 0; i < groups.length; i++) {
        total += groups[i];
    }
    return total;
}

function grouped_raw_value(segments) {
    var raw = "";
    segments.each(function() {
        raw += $(this).val();
    });
    return raw;
}

function fill_segments_from_raw(segments, groups, raw) {
    var offset = 0;
    raw = sanitize_segment_text(raw).slice(0, total_group_length(groups));
    segments.each(function(index) {
        this.value = raw.slice(offset, offset + groups[index]);
        offset += groups[index];
    });
}

function grouped_selection(segments, groups, field) {
    var index = segments.index(field);
    var offset = 0;
    for (var i = 0; i < index; i++) {
        offset += groups[i];
    }
    return {
        start: offset + field.selectionStart,
        end: offset + field.selectionEnd,
    };
}

function focus_grouped_position(segments, groups, position) {
    var offset = 0;
    var rawLength = grouped_raw_value(segments).length;
    position = Math.max(0, Math.min(position, rawLength));

    segments.each(function(index) {
        var local;
        if (index === segments.length - 1 ||
                position < offset + groups[index]) {
            local = position - offset;
            local = Math.max(0, Math.min(local, this.value.length));
            this.focus();
            this.setSelectionRange(local, local);
            return false;
        }
        offset += groups[index];
    });
}

function update_grouped_value(field, segments, spaces, riddle) {
    var raw = "";
    segments.each(function() {
        raw += $(this).val();
    });

    var key = add_spaces(raw, spaces);
    field.val(key);
    decrypt(riddle, key);
}

function set_grouped_raw(field, segments, groups, spaces, riddle, raw,
        cursorPos) {
    fill_segments_from_raw(segments, groups, raw);
    update_grouped_value(field, segments, spaces, riddle);
    if (cursorPos !== undefined)
        focus_grouped_position(segments, groups, cursorPos);
}

function apply_grouped_insert(raw, selection, text, totalLen) {
    var available = totalLen - (raw.length -
        (selection.end - selection.start));

    text = sanitize_segment_text(text).slice(0, Math.max(0, available));
    return {
        raw: raw.slice(0, selection.start) +
            text +
            raw.slice(selection.end),
        cursorPos: selection.start + text.length,
    };
}

function init_single_input(field) {
    var wrappedField = $(field).wrap("<div class='input'></div>");
    var wrapper = wrappedField.parent();
    var riddle = wrapper.next('.riddle');
    var guide = build_input_guide(
        parseInt(wrappedField.attr("maxlength"), 10));

    wrappedField
        .keypress(evt => {
            if (!isValidSingleInputLetter(evt.which)) {
                evt.preventDefault();
            }
        })
        .before("<div class='input-sizer' aria-hidden='true'>" +
            guide + "</div>")
        .before("<div class='input-border' aria-hidden='true'>" +
            guide + "</div>")
        .on('input', function() {
            var clean = sanitize_single_input_text(this.value);
            if (clean !== this.value)
                this.value = clean;
            decrypt(riddle, this.value);
        });

    decrypt(riddle, wrappedField.val());
}

function init_grouped_input(field) {
    var wrappedField = $(field).wrap("<div class='input input-grouped'></div>");
    var wrapper = wrappedField.parent();
    var riddle = wrapper.next('.riddle');
    var groups = parse_groups(wrappedField.attr("data-groups"));
    var spaces = groups_to_spaces(groups);
    var totalLen = total_group_length(groups);

    wrappedField.attr('type', 'hidden').addClass('grouped-value');

    for (var i = 0; i < groups.length; i++) {
        var guide = build_input_guide(groups[i]);
        wrappedField.before(
            "<div class='input-part'>" +
                "<div class='input-sizer' aria-hidden='true'>" +
                    guide + "</div>" +
                "<div class='input-border' aria-hidden='true'>" +
                    guide + "</div>" +
                "<input class='input-segment' type='text' maxlength='" +
                    groups[i] + "' autocomplete='off' " +
                    "autocapitalize='characters' autocorrect='off' " +
                    "spellcheck='false'>" +
            "</div>"
        );
    }

    var segments = wrapper.find('input.input-segment');

    segments
        .on('mousedown', function(evt) {
            var index = segments.index(this);
            var raw = grouped_raw_value(segments);
            var first = first_incomplete_segment(segments);
            if (raw.length < totalLen && index > first) {
                evt.preventDefault();
                focus_grouped_position(segments, groups, raw.length);
            }
        })
        .on('keydown', function(evt) {
            var raw = grouped_raw_value(segments);
            var selection = grouped_selection(segments, groups, this);
            var collapsed = selection.start === selection.end;

            if (evt.key === 'Backspace') {
                evt.preventDefault();
                if (collapsed) {
                    if (selection.start === 0)
                        return;
                    selection.start -= 1;
                }
                set_grouped_raw(
                    wrappedField,
                    segments,
                    groups,
                    spaces,
                    riddle,
                    raw.slice(0, selection.start) +
                        raw.slice(selection.end),
                    selection.start
                );
                return;
            }

            if (evt.key === 'Delete') {
                evt.preventDefault();
                if (collapsed) {
                    if (selection.end >= raw.length)
                        return;
                    selection.end += 1;
                }
                set_grouped_raw(
                    wrappedField,
                    segments,
                    groups,
                    spaces,
                    riddle,
                    raw.slice(0, selection.start) +
                        raw.slice(selection.end),
                    selection.start
                );
                return;
            }

            if (evt.key === 'ArrowLeft' && collapsed &&
                    this.selectionStart === 0 && selection.start > 0) {
                evt.preventDefault();
                focus_grouped_position(
                    segments, groups, selection.start - 1);
                return;
            }

            if (evt.key === 'ArrowRight' && collapsed &&
                    this.selectionStart === this.value.length &&
                    selection.end < raw.length) {
                evt.preventDefault();
                focus_grouped_position(segments, groups, selection.end + 1);
                return;
            }

            if (evt.key === 'Home') {
                evt.preventDefault();
                focus_grouped_position(segments, groups, 0);
                return;
            }

            if (evt.key === 'End') {
                evt.preventDefault();
                focus_grouped_position(segments, groups, raw.length);
                return;
            }

            if (!evt.ctrlKey && !evt.metaKey && !evt.altKey &&
                    evt.key.length === 1) {
                if (!isValidLetter(evt.key.charCodeAt(0)) ||
                        evt.key == ' ') {
                    evt.preventDefault();
                    return;
                }

                evt.preventDefault();
                var inserted = apply_grouped_insert(
                    raw, selection, evt.key, totalLen);
                set_grouped_raw(
                    wrappedField,
                    segments,
                    groups,
                    spaces,
                    riddle,
                    inserted.raw,
                    inserted.cursorPos
                );
            }
        })
        .on('input', function() {
            var selection = grouped_selection(segments, groups, this);
            set_grouped_raw(
                wrappedField,
                segments,
                groups,
                spaces,
                riddle,
                grouped_raw_value(segments),
                selection.end
            );
        })
        .on('paste', function(evt) {
            var clipboard;
            var raw = grouped_raw_value(segments);
            var selection = grouped_selection(segments, groups, this);

            evt.preventDefault();

            clipboard = evt.originalEvent && evt.originalEvent.clipboardData ?
                evt.originalEvent.clipboardData.getData('text') : "";
            clipboard = sanitize_segment_text(clipboard);
            if (!clipboard.length)
                return;

            var inserted = apply_grouped_insert(
                raw, selection, clipboard, totalLen);
            set_grouped_raw(
                wrappedField,
                segments,
                groups,
                spaces,
                riddle,
                inserted.raw,
                inserted.cursorPos
            );
        });

    if (wrappedField.val().length) {
        set_grouped_raw(
            wrappedField,
            segments,
            groups,
            spaces,
            riddle,
            wrappedField.val().replace(/ /g, '')
        );
    } else {
        update_grouped_value(wrappedField, segments, spaces, riddle);
    }
}

window.addEventListener('load', () => {
    $(".riddle[data-cipher]").append(function () {
        return "<span class='text'>" + decode($(this).attr('data-cipher'), '').replace(/\//g, '<br>') + "</span>";
    });
    $("input.input-field[data-groups]").each(function() {
        init_grouped_input(this);
    });
    $("input.input-field").not("[data-groups]").each(function() {
        init_single_input(this);
    });
    // wrap each riddle+input pair in a card for visual grouping
    $('#quest > .riddle').each(function() {
        var $next = $(this).next('div.input');
        $next.length
            ? $(this).add($next).wrapAll('<div class="card"></div>')
            : $(this).wrap('<div class="card"></div>');
    });
    // collapse header on scroll — hysteresis prevents oscillation
    $(window).on('scroll', function () {
        var scrollTop = $(this).scrollTop();
        var $header = $('#site-header');
        if (!$header.hasClass('scrolled') && scrollTop > 100) {
            $header.addClass('scrolled');
        } else if ($header.hasClass('scrolled') && scrollTop < 30) {
            $header.removeClass('scrolled');
        }
    });
});
