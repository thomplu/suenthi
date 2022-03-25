import './main.scss'

(function () {
    'use strict';

    const NOTE_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]
    const baseOctaveIndex = 3 //Octave index of the lower ocatave on the keyboard
    const SHOW_NUM_OCTAVES = 2
    const whiteKeyNum = SHOW_NUM_OCTAVES * 7 + 1
    const MAX_VOL = 0.3
    const KEY_CLASS_NAME = 'keys__key'
    const KEY_FREQ = {
        "c0": 16.35,
        "c#0": 17.32,
        "d0": 18.35,
        "d#0": 19.45,
        "e0": 20.60,
        "f0": 21.83,
        "f#0": 23.12,
        "g0": 24.50,
        "g#0": 25.96,
        "a0": 27.50,
        "a#0": 29.14,
        "b0": 30.87,
        "c1": 32.70,
        "c#1": 34.65,
        "d1": 36.71,
        "d#1": 38.89,
        "e1": 41.20,
        "f1": 43.65,
        "f#1": 46.25,
        "g1": 49.00,
        "g#1": 51.91,
        "a1": 55.00,
        "a#1": 58.27,
        "b1": 61.74,
        "c2": 65.41,
        "c#2": 69.30,
        "d2": 73.42,
        "d#2": 77.78,
        "e2": 82.41,
        "f2": 87.31,
        "f#2": 92.50,
        "g2": 98.00,
        "g#2": 103.83,
        "a2": 110.00,
        "a#2": 116.54,
        "b2": 123.47,
        "c3": 130.81,
        "c#3": 138.59,
        "d3": 146.83,
        "d#3": 155.56,
        "e3": 164.81,
        "f3": 174.61,
        "f#3": 185.00,
        "g3": 196.00,
        "g#3": 207.65,
        "a3": 220.00,
        "a#3": 233.08,
        "b3": 246.94,
        "c4": 261.63,
        "c#4": 277.18,
        "d4": 293.66,
        "d#4": 311.13,
        "e4": 329.63,
        "f4": 349.23,
        "f#4": 369.99,
        "g4": 392.00,
        "g#4": 415.30,
        "a4": 440,
        "a#4": 466.16,
        "b4": 493.88,
        "c5": 523.25,
        "c#5": 554.37,
        "d5": 587.33,
        "d#5": 622.25,
        "e5": 659.26,
        "f5": 698.46,
        "f#5": 739.99,
        "g5": 783.99,
        "g#5": 830.61,
        "a5": 880.00,
        "a#5": 932.33,
        "b5": 987.77,
        "c6": 1046.50,
        "c#6": 1108.73,
        "d6": 1174.66,
        "d#6": 1244.51,
        "e6": 1318.51,
        "f6": 1396.91,
        "f#6": 1479.98,
        "g6": 1567.98,
        "g#6": 1661.22,
        "a6": 1760.00,
        "a#6": 1864.66,
        "b6": 1975.53,
        "c7": 2093.00,
        "c#7": 2217.46,
        "d7": 2349.32,
        "d#7": 2489.02,
        "e7": 2637.02,
        "f7": 2793.83,
        "f#7": 2959.96,
        "g7": 3135.96,
        "g#7": 3322.44,
        "a7": 3520.00,
        "a#7": 3729.31,
        "b7": 3951.07,
        "c8": 4186.01
    };

    //Controls variables with default values

    let octaveShift = 0
    let oscType = 'sine'
    let release = 0.45
    let attack = 0.0
    let filterFreq = 1000
    let filterQVal = 5
    let lfoFreqVal = 1
    let lfoGainVal = 300

    //Node elements
    const $keyBoard = document.querySelector('.keyboard');
    const $keys = document.querySelector('.keys');
    document.querySelector('#audio-btn');
    const $octaveUpBtn = document.querySelector('.octave__btn-up');
    const $octaveDownBtn = document.querySelector('.octave__btn-down');
    const $octaveDisplay = document.querySelector('.octave__val');
    const $oscTypeInputs = document.querySelector('.controls__osc-type-inputs');
    const $attackRange = document.getElementById('attack')
    const $releaseRange = document.getElementById('release')
    const $filterFreqRange = document.getElementById('filter-freq')
    const $filterQRange = document.getElementById('filter-q')
    const $lfoFreqRange = document.getElementById('lfo-freq')
    const $lfoGainRange = document.getElementById('lfo-gain')
    document.documentElement.style.setProperty('--white-key-num', whiteKeyNum);

    //Creating the audio chain elements
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const filter = audioCtx.createBiquadFilter();
    const mainGain = audioCtx.createGain()
    const lfo = audioCtx.createOscillator()
    const lfoGain = audioCtx.createGain()

    lfo.type = "sine"
    lfo.frequency.value = lfoFreqVal
    lfoGain.gain.value = lfoGainVal
    filter.type = "lowpass"
    filter.frequency.value = filterFreq
    filter.gain.value = 0
    filter.Q.value = filterQVal

    // Wire the audio chain elements
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    mainGain.gain.setValueAtTime(1, audioCtx.currentTime);
    mainGain.connect(filter).connect(audioCtx.destination)

    lfo.start(0)

    let oscObject = {}

    createKeys();


    function onMIDIMessage(event) {

        const data = event.data;
        if (data.length !== 3) return

        // status is the first byte.
        let status = data[0];
        // command is the four most significant bits of the status byte.
        let command = status >>> 4;

        // just look at note on and note off messages.
        if (command === 0x9 || command === 0x8) {
            // note number is the second byte.
            let note = data[1];
            // velocity is the thrid byte.
            let velocity = data[2];

            let noteOn = command === 0x9;

            // calculate octave and note name.
            let octave = Math.trunc(note / 12) - 1; //First octave index = -1
            let noteName = NOTE_NAMES[note % 12].toLowerCase();

            noteOn ? console.log('PRESSED MIDI Key', `${noteName}${octave}`, velocity) : console.log('RELEASED MIDI Key', `${noteName}${octave}`);

            playKey(noteName, octave + octaveShift, noteOn ? velocity / 127 : 0);

        }

        //console.log('EVENT', event)
        "MIDI message received at timestamp " + event.timestamp + "[" + event.data.length + " bytes]: ";
    }

    function startLoggingMIDIInput(midiAccess, indexOfPort) {
        console.log('startLoggingMIDIInput');
        midiAccess.inputs.forEach(entry => {
            // console.log('entry', entry)
            entry.onmidimessage = onMIDIMessage;
        });
    }

    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(midiAccess => {
            startLoggingMIDIInput(midiAccess);
        });
    }

    // var gain = audioCtx.createGain();
    // const oscillator = audioCtx.createOscillator();
    // oscillator.type = 'square';
    // oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // value in hertz
    // gain.gain.value = 0;
    // oscillator.connect(gain);
    // gain.connect(audioCtx.destination);
    // oscillator.start();

    //$audioBtn.addEventListener('click', audioBtnClicked)
    $keyBoard.addEventListener('touchstart', e => {
        const $clickedKey = e.target;
        console.log('TOUCHSTART', e.target.dataset.key);
        mousePressed($clickedKey, true);
    });

    $keyBoard.addEventListener('mousedown', e => {
        const $clickedKey = e.target;
        console.log('MOUSEDOWN', e.target.dataset.key);
        mousePressed($clickedKey, true);
    });

    $keyBoard.addEventListener('mouseup', e => {
        console.log('MOUSEUP', e.target.dataset.key);
        const $clickedKey = e.target;
        mousePressed($clickedKey, false);
    });

    document.body.addEventListener('touchend', e => {
        console.log('TOUCHEND', e.target.dataset.key);
        const $clickedKey = e.target;
        mousePressed($clickedKey, false);
    });

    $octaveUpBtn.addEventListener('click', e => {
        octaveShift++;
        updateBaseOctave();
    });

    $octaveDownBtn.addEventListener('click', e => {
        octaveShift--;
        updateBaseOctave();
    });

    $oscTypeInputs.addEventListener('click', e => {
        oscType = $oscTypeInputs.querySelector('input:checked').value || oscType;
        console.log('new osc type', oscType);
    })

    $attackRange.addEventListener('change', e => {
        const val = $attackRange.value
        attack = Number(val)
        console.log('attack changed to', val)
    })

    $releaseRange.addEventListener('change', e => {
        const val = $releaseRange.value
        release = Number(val)
        console.log('release changed to', val)
    })

    $filterFreqRange.addEventListener('change', () => {
        const val = $filterFreqRange.value
        filterFreq = parseInt(val)
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(parseInt(filterFreq), audioCtx.currentTime)
        console.log('filter freq changed to', val, filter)
    })

    $filterQRange.addEventListener('change', () => {
        const val = $filterQRange.value
        filter.Q.value = filterQVal = parseInt(val)
        console.log('filter Q changed to', val)
    })

    $lfoFreqRange.addEventListener('change', () => {
        const val = $lfoFreqRange.value
        lfoFreqVal = parseInt(val)
        lfo.frequency.value = lfoFreqVal
        console.log('lfo freq changed to', val)
    })

    $lfoGainRange.addEventListener('change', () => {
        const val = $lfoGainRange.value
        lfoGainVal = parseInt(val)
        lfoGain.gain.value = lfoGainVal
        console.log('lfo gain changed to', val, )
    })

    function generateRandomId() {
        return Math.floor(Math.random()*0xca0e373ebffff+0x05c5e45240000).toString(36)
    }

    function addOscVoice(key) {
        const newOsc = {
            osc: audioCtx.createOscillator(),
            gainNode: audioCtx.createGain(),
            key: key
        };

        newOsc.osc.type = oscType;
        newOsc.gainNode.gain.value = 0;
        newOsc.osc.connect(newOsc.gainNode);
        newOsc.gainNode.connect(mainGain);
        const id = generateRandomId()
        oscObject[id] = newOsc
        console.log('oscObj', oscObject)
        return id //Returns the index
    }

    function createKeys() {
        for (let o = baseOctaveIndex; o < baseOctaveIndex + SHOW_NUM_OCTAVES; o++) {
            console.log('octave', o);
            console.log('note_names', NOTE_NAMES);
            NOTE_NAMES.forEach(keyName => {
                createSingleKey(keyName, o);
            });
        }
        //Add the 'C' key at top
        createSingleKey('c', baseOctaveIndex + SHOW_NUM_OCTAVES);
    }

    function createSingleKey(keyName, octave) {
        console.log('keyNAme', keyName);
        const $key = document.createElement('div');
        $key.dataset.key = keyName.toLowerCase() + octave;
        $key.dataset.keyname = keyName.toLowerCase();
        $key.dataset.octave = octave;
        $key.classList.add(KEY_CLASS_NAME);
        $key.id = `${keyName}${octave}`;
        console.log('last char', keyName.substr(keyName.length - 1));
        keyName.substr(keyName.length - 1) === '#' ? $key.classList.add('is--black') : 0;
        $keys.appendChild($key);
    }

    function mousePressed($key, pressed) {
        console.log('mousedPressed', $key.dataset.key, pressed);
        if (!$key.dataset.key) return
        if (!pressed) {
            stopPlaying(`${$key.dataset.keyname}${parseInt($key.dataset.octave) + octaveShift}`);
            return
        }
        console.log('notename', $key.dataset.keyname, 'ocateve', parseInt($key.dataset.octave) + octaveShift);
        playKey($key.dataset.keyname, parseInt($key.dataset.octave) + octaveShift, pressed ? 1 : 0);
    }

    function stopPlaying(key) {
        console.log('STOP playing key', key);
        let oscId = undefined
        Object.keys(oscObject).forEach(id => {
            if (oscObject[id].key === key && !oscObject[id].release){
                oscId = id
            }
        })
        if (oscId === undefined) {
            console.error('Osc Index not found for ' + key);
            return
        }
        oscObject[oscId].gainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + release);
        oscObject[oscId].release = true
        setTimeout(() => {
            oscObject[oscId].osc.stop();
            console.log('REMOVE OSC');
            delete oscObject[oscId]
            console.log('new stop oscObj', JSON.stringify(oscObject));
        }, release * 1000)

        const htmlKeyId = key.slice(0,key.length - 1) + (parseInt(key.slice(key.length - 1,key.length)) - octaveShift)
        console.log('key', key, 'octaveShift', octaveShift, 'htmlKeyId', htmlKeyId)
        document.querySelector(`.${KEY_CLASS_NAME}[data-key='${htmlKeyId}']`)?.classList.remove('is--pressed');
    }

    function playKey(keyName, octave, velocity) {
        const keyboardKey = `${keyName}${octave - octaveShift}`;
        const key = `${keyName}${octave}`
        if (!KEY_FREQ[key]) return
        if (velocity === 0) {
            stopPlaying(key);
            return
        }
        const freq = KEY_FREQ[key];
        const $key = document.getElementById(keyboardKey);
        console.log('playKey', 'key', key, 'keyboardKey', keyboardKey, velocity, freq);

        $key?.classList.toggle('is--pressed', velocity > 0);
        if (velocity === 0) return
        const oscId = addOscVoice(key);

        oscObject[oscId].osc.start();
        oscObject[oscId].osc.frequency.value = freq;

        if (velocity > 1) {
            velocity = 1;
        }
        oscObject[oscId].gainNode.gain.linearRampToValueAtTime( MAX_VOL * velocity, audioCtx.currentTime + attack);
        // gain.gain.value = MAX_VOL * velocity;
        console.log('new play oscObj', oscObject[oscId], JSON.stringify(oscObject));
    }

    function updateBaseOctave() {
        $octaveDisplay.innerText = octaveShift;
    }

})();
//# sourceMappingURL=main.js.map
