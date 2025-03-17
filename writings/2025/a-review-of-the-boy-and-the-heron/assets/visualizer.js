// get mm from global scope
const mm = window.core;
let currentlyPlayingIndex = -1;


const player = new mm.SoundFontPlayer(
    'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus',
    undefined,
    null, null, {
        run: (note) => {
            if (currentlyPlayingIndex >= 0 && currentlyPlayingIndex < visualizers.length) {
                visualizers[currentlyPlayingIndex].redraw(note, true);
            }
        },
    }
);

const staffs = document.getElementsByClassName("staff");
const visualizers = new Array(staffs.length);
const sequences = new Array(staffs.length);
const audioElements = new Array(staffs.length);


for (let i = 0; i < staffs.length; i++) {
    const staff = staffs[i];
    const motif = staff.getAttribute("motif");
    

    const audioElement = document.createElement('audio');
    audioElement.style.display = "none";
    audioElement.src = `/writings/2025/a-review-of-the-boy-and-the-heron/assets/motifs/${motif}.mp3`;
    audioElement.controls = true;
    audioElement.volume = 0.5;
    audioElements[i] = audioElement;
    
    staff.parentNode.appendChild(audioElement);
    staff.addEventListener('click', () => startOrStop(i));
    
    mm.urlToNoteSequence(`/writings/2025/a-review-of-the-boy-and-the-heron/assets/motifs/${motif}.mid`)
        .then(seq => {
            sequences[i] = seq;
            visualizers[i] = new mm.StaffSVGVisualizer(seq, staff);
            player.loadSamples(seq); // preload samples
        })
        .catch(error => console.error(`Failed to load motif ${motif}:`, error));
}

function startOrStop(index) {
	if (sequences[index].tempos && sequences[index].tempos.length > 0) {
		player.setTempo(sequences[index].tempos[0].qpm);
	}
	// already playing something
    if (currentlyPlayingIndex !== -1) {
        player.stop();
        // lol this doesn't work in stop i gotta do this out here
		for (let i = 0; i < visualizers.length; i++) {
			visualizers[i].clearActiveNotes();
			visualizers[i].clear();
			visualizers[i].redraw(null, false);
		}
        
        if (audioElements[currentlyPlayingIndex]) {
            audioElements[currentlyPlayingIndex].pause();
            audioElements[currentlyPlayingIndex].currentTime = 0;
        }
        
        // visual state
        staffs[currentlyPlayingIndex].setAttribute("playing", "false");
        if (visualizers[currentlyPlayingIndex]) {
            visualizers[currentlyPlayingIndex].clearActiveNotes();
        }
        
        // if we click on what we're playing just stop
        if (currentlyPlayingIndex === index) {
            currentlyPlayingIndex = -1;
            return;
        }
    }
    
    currentlyPlayingIndex = index;
	staffs[index].setAttribute("playing", "true");
    
    // use audio, fallback to midi
    if (audioElements[index] != null) {
        player.output.volume.value = -Infinity;
        player.start(sequences[index]);
        audioElements[index].currentTime = 0;
        audioElements[index].play().catch(err => {
            console.error("Audio playback failed:", err);
            player.output.volume.value = 0;
        });
    } else {
        player.output.volume.value = 0;
        player.start(sequences[index]);
    }
}