const MIDI_TRUE = 0x7F;
const MIDI_FALSE = 0x00;
// eslint-disable-next-line no-var
var PioneerDdjErgo = {};

PioneerDdjErgo.lights = {
    fx1ToChannel1: {
        status: 0x96,
        data1: 0x4C,
    },
    fx2ToChannel1: {
        status: 0x96,
        data1: 0x50,
    },
    fx1ToChannel2: {
        status: 0x96,
        data1: 0x4D,
    },
    fx2ToChannel2: {
        status: 0x96,
        data1: 0x51,
    },
    decks: [
        // Deck 1
        {
            playPause: {
                status: 0x90,
                data1: 0x0B,
            },
            keylock: {
                status: 0x90,
                data1: 0x1A,
            },
            loopIn: {
                status: 0x90,
                data1: 0x10,
            },
            loopOut: {
                status: 0x90,
                data1: 0x11,
            },
            syncEnabled: {
                status: 0x90,
                data1: 0x58,
            },
            headphones: {
                status: 0x96,
                data1: 0x54,
            },
        },
        
        // Deck2
        {
            playPause: {
                status: 0x91,
                data1: 0x0B,
            },
            keylock: {
                status: 0x91,
                data1: 0x1A,
            },
            loopIn: {
                status: 0x91,
                data1: 0x10,
            },
            loopOut: {
                status: 0x91,
                data1: 0x11,
            },
            syncEnabled: {
                status: 0x91,
                data1: 0x58,
            },
            headphones: {
                status: 0x96,
                data1: 0x55,
            },
        }
    ]
};

// Jog wheel constants
PioneerDdjErgo.vinylMode = true;
PioneerDdjErgo.alpha = 1.0 / 8;
PioneerDdjErgo.beta = PioneerDdjErgo.alpha / 32;

// Multiplier for fast seek through track using SHIFT+JOGWHEEL
PioneerDdjErgo.fastSeekScale = 150;
PioneerDdjErgo.bendScale = 0.3;

PioneerDdjErgo.tempoRanges = [ 0.06, 0.10, 0.16, 0.25 ];

PioneerDdjErgo.shiftButtonDown = [ false, false ];

// Jog wheel loop adjust
PioneerDdjErgo.loopAdjustIn = [ false, false ];
PioneerDdjErgo.loopAdjustOut = [ false, false ];
PioneerDdjErgo.loopAdjustMultiply = 50;

PioneerDdjErgo.init = function() {
    // Disable all leds
    // for (var s = 0x90; s < 0x92; s++) {
    // 0x94 - FX1 group leds
    // 0x95 - FX2 group leds
    // 0x96 - FX send leds 
    // for (var i = 0x0; i <= 0xff; i++) {
    //     midi.sendShortMsg(0xb6, i, MIDI_FALSE);
    // }
    // midi.sendShortMsg(0x9B, 0x78, MIDI_TRUE);
    // midi.sendShortMsg(0x9B, 0x79, MIDI_TRUE);
    //midi.sendShortMsg(0xb6, 0x09, MIDI_TRUE);
    //midi.sendShortMsg(0xb6, 0x10, MIDI_TRUE);
    // for (var i = 0x0; i <= 0xff; i++) {
    //     midi.sendShortMsg(0xb6, i, MIDI_TRUE);
    // }

    // engine.makeUnbufferedConnection("[Channel1]", "VuMeter", PioneerDdjErgo.vuMeterUpdate);
    // engine.makeUnbufferedConnection("[Channel2]", "VuMeter", PioneerDdjErgo.vuMeterUpdate);
    
    // Creating midi connections 
    engine.makeConnection("[Channel1]", "sync_enabled", PioneerDdjErgo.syncPressed);
    engine.makeConnection("[Channel2]", "sync_enabled", PioneerDdjErgo.syncPressed);
    engine.makeConnection("[Channel1]", "play", PioneerDdjErgo.playPausePressed);
    engine.makeConnection("[Channel2]", "play", PioneerDdjErgo.playPausePressed);
    engine.makeConnection("[Channel1]", "keylock", PioneerDdjErgo.keylockPressed);
    engine.makeConnection("[Channel2]", "keylock", PioneerDdjErgo.keylockPressed);
    engine.makeConnection("[Channel1]", "pfl", PioneerDdjErgo.headphonePressed);
    engine.makeConnection("[Channel2]", "pfl", PioneerDdjErgo.headphonePressed);
    engine.makeConnection("[Channel1]", "loop_in", PioneerDdjErgo.loop);
    engine.makeConnection("[Channel2]", "loop_in", PioneerDdjErgo.loop);
    engine.makeConnection("[Channel1]", "loop_out", PioneerDdjErgo.loop);
    engine.makeConnection("[Channel2]", "loop_out", PioneerDdjErgo.loop);
    engine.makeConnection("[EffectRack1_EffectUnit1]", "group_[Channel1]_enable", PioneerDdjErgo.effectRack1);
    engine.makeConnection("[EffectRack1_EffectUnit2]", "group_[Channel1]_enable", PioneerDdjErgo.effectRack2);
    engine.makeConnection("[EffectRack1_EffectUnit1]", "group_[Channel2]_enable", PioneerDdjErgo.effectRack1);
    engine.makeConnection("[EffectRack1_EffectUnit2]", "group_[Channel2]_enable", PioneerDdjErgo.effectRack2);
    print("Script loaded. Lucas Roberts is a man...");
};

PioneerDdjErgo.toggleLight = function(midiIn, active) {
    midi.sendShortMsg(midiIn.status, midiIn.data1, active ? MIDI_TRUE : 0);
};

PioneerDdjErgo.vuMeterUpdate = function(value, group) {
    const newVal = value * 150;

    switch (group) {
    case "[Channel1]":
        midi.sendShortMsg(0xB0, 0x02, newVal);
        break;

    case "[Channel2]":
        midi.sendShortMsg(0xB1, 0x02, newVal);
        break;
    }
};

PioneerDdjErgo.shutdown = function() {
    // turn off all LEDs
    for (var i = 1; i <= 40; i++) {
        midi.sendShortMsg(0x90, i, 0x00);
    }
};

// status 0xB0 (ch 1, opcode 0xB), ctrl 0x21, val 0x01
PioneerDdjErgo.jogTurn = function(channel, _control, value, _status, group) {
    var deckNum = channel + 1;
    // wheel center at 64; <64 rew >64 fwd
    var newVal = value - 64;

    // loop_in / out adjust
    var loopEnabled = engine.getValue(group, "loop_enabled");
    if (loopEnabled > 0) {
        if (PioneerDdjErgo.loopAdjustIn[channel]) {
            newVal = newVal * PioneerDdjErgo.loopAdjustMultiply + engine.getValue(group, "loop_start_position");
            engine.setValue(group, "loop_start_position", newVal);
            return;
        }
        if (PioneerDdjErgo.loopAdjustOut[channel]) {
            newVal = newVal * PioneerDdjErgo.loopAdjustMultiply + engine.getValue(group, "loop_end_position");
            engine.setValue(group, "loop_end_position", newVal);
            return;
        }
    }

    if (engine.isScratching(deckNum)) {
        engine.scratchTick(deckNum, newVal);
    } else { // fallback
        engine.setValue(group, "jog", newVal * this.bendScale);
    }
};

PioneerDdjErgo.jogSearch = function(_channel, _control, value, _status, group) {
    var newVal = (value - 64) * PioneerDdjErgo.fastSeekScale;
    engine.setValue(group, "jog", newVal);
};

PioneerDdjErgo.jogTouch = function(channel, _control, value) {
    var deckNum = channel + 1;

    // skip while adjusting the loop points
    if (PioneerDdjErgo.loopAdjustIn[channel] || PioneerDdjErgo.loopAdjustOut[channel]) {
        return;
    }

    if (value !== 0 && this.vinylMode) {
        engine.scratchEnable(deckNum, 720, 33 + 1 / 3, this.alpha, this.beta);
    } else {
        engine.scratchDisable(deckNum);
    }
};


PioneerDdjErgo.loopHalveDouble = function(_channel, _control, value, _status, group) {
    if (value === MIDI_TRUE) {
        engine.setValue(group, "loop_halve", value);
    } else {
        engine.setValue(group, "loop_double", value);
    }
};

PioneerDdjErgo.beatsTranslate = function(_channel, _control, value, _status, group) {
    if (value === MIDI_TRUE) {
        engine.setValue(group, "beats_translate_earlier", value);
    } else {
        engine.setValue(group, "beats_translate_later", value);
    }
};

PioneerDdjErgo.beatsAdjust = function(_channel, _control, value, _status, group) {
    if (value === MIDI_TRUE) {
        engine.setValue(group, "beats_adjust_slower", value);
    } else {
        engine.setValue(group, "beats_adjust_faster", value);
    }
};

PioneerDdjErgo.beatloopActivate = function(channel, _control, value, _status, group) {
    if (value === 0) { return; }
    const loopEnabled = engine.getValue(group, "loop_enabled");
    if (!loopEnabled) {
        engine.setValue(group, "beatloop_activate", MIDI_TRUE);
    } else {
        engine.setValue(group, "loop_enabled", MIDI_FALSE);
        engine.setValue(group, "loop_exit", MIDI_TRUE);
        PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].loopIn, MIDI_FALSE);
        PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].loopOut, MIDI_FALSE);
    }
};


// Connection functions.
// Mostly led controls.

PioneerDdjErgo.syncPressed = function(value, group, control) {
    const channel = (group == "[Channel1]") ? 0 : 1;
    const syncActive = (engine.getValue(group, control) > 0) ? MIDI_TRUE : MIDI_FALSE;
    PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].syncEnabled, syncActive);
};

PioneerDdjErgo.playPausePressed= function(value, group, _control) {
    const channel = (group == "[Channel1]") ? 0 : 1;
    PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].playPause, value);
};

PioneerDdjErgo.keylockPressed = function(_value, group, control) {
    const keylockActive = (engine.getValue(group, control) > 0) ? MIDI_TRUE : MIDI_FALSE;
    const channel = (group == "[Channel1]") ? 0 : 1;
    PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].keylock, keylockActive);
};

PioneerDdjErgo.headphonePressed = function(_value, group, control) {
    const pflActive = (engine.getValue(group, control) > 0) ? MIDI_TRUE : MIDI_FALSE;
    const channel = (group == "[Channel1]") ? 0 : 1;
    PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].headphones, pflActive);
};

PioneerDdjErgo.loop = function(_value, group, _control) {
    if (_value === 0) { return; }
    const loopInActive = (engine.getValue(group, "loop_in") > 0) ? MIDI_TRUE : MIDI_FALSE;
    const loopOutActive = (engine.getValue(group, "loop_out") > 0) ? MIDI_TRUE : MIDI_FALSE;
    const channel = (group == "[Channel1]") ? 0 : 1;
    PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].loopIn, loopInActive);
    PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.decks[channel].loopOut, loopOutActive);
};

PioneerDdjErgo.effectRack1 = function(_value, group, control) {
    const fx1Routed = (engine.getValue(group, control) > 0) ? MIDI_TRUE : MIDI_FALSE;
    if (control == "group_[Channel1]_enable") {
        PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.fx1ToChannel1, fx1Routed);
    } else {
        PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.fx1ToChannel2, fx1Routed);
    }
};

PioneerDdjErgo.effectRack2 = function(_value, group, control) {
    const fx2Routed = (engine.getValue(group, control) > 0) ? MIDI_TRUE : MIDI_FALSE;
    if (control == "group_[Channel1]_enable") {
        PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.fx2ToChannel1, fx2Routed);
    } else {
        PioneerDdjErgo.toggleLight(PioneerDdjErgo.lights.fx2ToChannel2, fx2Routed);
    }
};

// [EffectRack1_EffectUnit1],group_[Channel1]_enable

