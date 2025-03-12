/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Using the globally available mm object from CDN imports
// No need to import since it's available through script tags

// fetchMidi(MIDI_URL))

const MIDI_URL = '/writings/2025/heron/assets/midi/heron_ext.mid';
let visualizers = [];
let currentSequence = null;

// Access mm from the global scope
const mm = window.core;


const player = new mm.SoundFontPlayer(
    'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus',
    mm.Player.tone.Master, null, null, {
      run: (note) => {
        for (let i = 0; i < visualizers.length; i++) {
          visualizers[i].redraw(note, true);
        }
      },
      stop: () => {
        for (let i = 0; i < visualizers.length; i++) {
          visualizers[i].clearActiveNotes();
        }
      }
    });

// UI elements
const playBtn = document.getElementById('playBtn')
const dummyBtn = document.getElementById('dummyBtn');

const tempoInput = document.getElementById('tempoInput');
const tempoValue = document.getElementById('tempoValue');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const svg = document.getElementsByTagName('svg')[0];
const waterfall = document.querySelector('#waterfall');
const staff = document.getElementById('staff');
const waterfallCheckbox = document.getElementById('waterfallCheckbox');
const styleInput = document.getElementById('styleInput');
const applyStyleBtn = document.getElementById('applyStyleBtn');
const customStyle = document.getElementById('customStyle');

// Set up some event listeners
playBtn.addEventListener('click', () => startOrStop());

dummyBtn.addEventListener('click', () => fetchMidi(MIDI_URL));


fileInput.addEventListener('change', loadFile);
tempoInput.addEventListener('input', () => {
  player.setTempo(parseInt(tempoInput.value, 10));
  tempoValue.textContent = tempoInput.value;
});
waterfallCheckbox.addEventListener('change', () => {
  if (visualizers.length === 0) {
    return;
  } else {
    visualizers[2] = new mm.WaterfallSVGVisualizer(
        currentSequence, waterfall,
        {showOnlyOctavesUsed: waterfallCheckbox.checked});
  }
});



applyStyleBtn.addEventListener('click', () => {
  customStyle.textContent = styleInput.value;
  document.getElementById('PianoRollSVGVisualizer').scrollIntoView();
});

function fetchMidi(url) {
  mm.urlToNoteSequence(url).then((seq) => initPlayerAndVisualizer(seq));
}

function loadFile(e) {
  mm.blobToNoteSequence(e.target.files[0])
      .then((seq) => initPlayerAndVisualizer(seq));
}

async function initPlayerAndVisualizer(seq) {
  // Disable the UI.
  playBtn.disabled = false;
  playBtn.textContent = 'Loading';

  visualizers = [
    new mm.PianoRollSVGVisualizer(seq, svg),
    new mm.StaffSVGVisualizer(seq, staff),
    new mm.WaterfallSVGVisualizer(
        seq, waterfall, {showOnlyOctavesUsed: waterfallCheckbox.checked}),
    new mm.PianoRollCanvasVisualizer(seq, canvas),
  ];
  currentSequence = seq;

  const tempo = seq.tempos[0].qpm;
  player.setTempo(tempo);
  tempoValue.textContent = tempoInput.value = '' + tempo;

  // Enable the UI.
  await player.loadSamples(seq);
  playBtn.disabled = false;
  playBtn.textContent = 'Play';
}

function startOrStop() {
  if (player.isPlaying()) {
    player.stop();
    playBtn.textContent = 'Play';
  } else {
    player.start(currentSequence);
    playBtn.textContent = 'Stop';
  }
}