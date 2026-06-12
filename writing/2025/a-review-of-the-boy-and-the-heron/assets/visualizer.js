const mm = window.core;
let currentlyPlayingIndex = -1;
let activeBeatNotes = []; // all notes at the current beat (chords have multiple)
let activeBeatStart = -1;

function cssRGB(variable) {
    const tmp = document.createElement('span');
    document.documentElement.appendChild(tmp);
    tmp.style.color = variable;
    const rgb = getComputedStyle(tmp).color.match(/\d+/g).slice(0, 3).join(', ');
    tmp.remove();
    return rgb;
}

function noteRGB()   { return cssRGB('var(--text)'); }
function accentRGB() { return cssRGB('var(--accent)'); }

function recolorAll() {
    const rgb       = noteRGB();
    const activeRGB = accentRGB();
    for (let i = 0; i < visualizers.length; i++) {
        if (!visualizers[i]) continue;
        if (visualizers[i].config) {
            visualizers[i].config.noteRGB       = rgb;
            visualizers[i].config.activeNoteRGB = activeRGB;
        }
        if (visualizers[i].render?.config) {
            visualizers[i].render.config.noteRGB       = rgb;
            visualizers[i].render.config.activeNoteRGB = activeRGB;
        }
        visualizers[i].clear();
        visualizers[i].redraw(null, false);
        // Re-highlight all notes at the current beat (covers full chords, not just last note).
        if (i === currentlyPlayingIndex) {
            for (const n of activeBeatNotes) visualizers[i].redraw(n, true);
        }
    }
}

const player = new mm.SoundFontPlayer(
    'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus',
    undefined, null, null, {
        run: (note) => {
            // Group notes by start time so chords are tracked together.
            if (note.startTime !== activeBeatStart) {
                activeBeatStart = note.startTime;
                activeBeatNotes = [];
            }
            activeBeatNotes.push(note);
            if (currentlyPlayingIndex >= 0 && currentlyPlayingIndex < visualizers.length) {
                visualizers[currentlyPlayingIndex].redraw(note, true);
            }
        },
    }
);

const staffs        = document.getElementsByClassName('staff');
const visualizers   = new Array(staffs.length);
const sequences     = new Array(staffs.length);
const bpm           = new Array(staffs.length);
const audioElements = new Array(staffs.length);

for (let i = 0; i < staffs.length; i++) {
    const staff = staffs[i];
    const motif = staff.getAttribute('motif');
    if (staff.hasAttribute('bpm')) bpm[i] = staff.getAttribute('bpm');

    const audio = document.createElement('audio');
    audio.style.display = 'none';
    audio.src = `/writing/2025/a-review-of-the-boy-and-the-heron/assets/motifs/${motif}.mp3`;
    audio.volume = 0.5;
    audioElements[i] = audio;
    staff.parentNode.appendChild(audio);
    staff.addEventListener('click', () => startOrStop(i));

    mm.urlToNoteSequence(`/writing/2025/a-review-of-the-boy-and-the-heron/assets/motifs/${motif}.mid`)
        .then(seq => {
            sequences[i] = seq;
            visualizers[i] = new mm.StaffSVGVisualizer(seq, staff, {
                noteRGB:       noteRGB(),
                activeNoteRGB: accentRGB(),
            });
            player.loadSamples(seq);
        })
        .catch(err => console.error(`Failed to load motif ${motif}:`, err));
}

new MutationObserver(recolorAll).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

function startOrStop(index) {
    if (sequences[index].tempos?.length > 0) {
        player.setTempo(bpm[index] != null ? bpm[index] : sequences[index].tempos[0].qpm);
    }

    if (currentlyPlayingIndex !== -1) {
        player.stop();
        activeBeatNotes = []; activeBeatStart = -1;
        for (let i = 0; i < visualizers.length; i++) {
            if (visualizers[i]) {
                visualizers[i].clearActiveNotes();
                visualizers[i].clear();
                visualizers[i].redraw(null, false);
            }
        }
        if (audioElements[currentlyPlayingIndex]) {
            audioElements[currentlyPlayingIndex].pause();
            audioElements[currentlyPlayingIndex].currentTime = 0;
        }
        staffs[currentlyPlayingIndex].setAttribute('playing', 'false');
        if (currentlyPlayingIndex === index) { currentlyPlayingIndex = -1; return; }
    }

    currentlyPlayingIndex = index;
    staffs[index].setAttribute('playing', 'true');

    if (audioElements[index]) {
        player.output.volume.value = -Infinity;
        player.start(sequences[index]);
        audioElements[index].currentTime = 0;
        audioElements[index].play().catch(() => { player.output.volume.value = 0; });
    } else {
        player.output.volume.value = 0;
        player.start(sequences[index]);
    }
}
