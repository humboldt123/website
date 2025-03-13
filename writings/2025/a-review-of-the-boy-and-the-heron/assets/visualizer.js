// get mm from global scope
const mm = window.core;
let last_index = -1;

// we should just mute this 
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
	}
);

const jukebox = document.getElementById('jukebox');

const staffs = document.getElementsByClassName("staff");
const visualizers = new Array(staffs.length); // will be popualted with motifs
const sequences = new Array(staffs.length); 

const music_players = new Array(staffs.length); 

for (let i = 0; i < staffs.length; i++) {
	let staff = staffs[i];
	staff.addEventListener('click', () => startOrStop(i));

	let motif = staff.getAttribute("motif");

	const audioElement = Object.assign(document.createElement('audio'), { 
		style: "display: none;", 
		src: `/writings/2025/a-review-of-the-boy-and-the-heron/assets/motifs/${motif}.mp3`,
		controls: true,
		volume: 0.5 
	});

	audioElement.onloadeddata = function() {
		music_players[i] = this;
	};

	staff.parentNode.appendChild(audioElement);

	mm.urlToNoteSequence(`/writings/2025/a-review-of-the-boy-and-the-heron/assets/motifs/${motif}.mid`)
	  .then(seq => {
		visualizers[i] = new mm.StaffSVGVisualizer(seq, staff);
		sequences[i] = seq;
		const tempo = seq.tempos[0].qpm;
		player.setTempo(tempo);
		player.loadSamples(seq);
	  })
	  .catch(error => console.error(`Failed to load motif ${motif}:`, error));
  }



function startOrStop(index) {
	if (player.isPlaying()) {
		player.stop();
		music_players[index].pause();
		music_players[index].current_time = 0;

		for (let i = 0; i < staffs.length; i++) {
			staffs[i].setAttribute("playing", false);
			if (visualizers[i]) {
				visualizers[i].clearActiveNotes();
			}
		}
	} else {
		if (music_players[index] != null) {
			mm.Player.tone.Master.volume.value - Infinity;
			music_players[index].play();
		} else {
			mm.Player.tone.Master.volume.value = 0;
		}
		player.start(sequences[index]);
		staffs[index].setAttribute("playing", true);
	}
	last_index = index;
}