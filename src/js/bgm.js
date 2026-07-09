// このjsファイルはBGM再生管理用共通モジュールです.
(function () {
    const STORAGE_KEY = 'rpg-bgm-state';
    const scriptElement = document.currentScript || document.querySelector('script[src*="bgm.js"]');
    const scriptBaseUrl = scriptElement ? new URL('.', scriptElement.src) : new URL('./', window.location.href);
    const BGM_SRC = new URL('./甘茶の音楽工房_フィヨルドの澄んだ風.mp3', scriptBaseUrl).href;
    const DEFAULT_VOLUME = 100;

    const state = {
        audio: null,
        volume: DEFAULT_VOLUME,
        isPlaying: false,
        currentTime: 0,
        initialized: false
    };

    function readPersistedState() {
        try {
            const rawState = sessionStorage.getItem(STORAGE_KEY);
            if (!rawState) {
                return null;
            }
            return JSON.parse(rawState);
        } catch (error) {
            console.warn('BGM状態の読み込みに失敗しました:', error);
            return null;
        }
    }

    function writePersistedState() {
        try {
            const snapshot = {
                volume: state.volume,
                isPlaying: state.isPlaying,
                currentTime: state.currentTime
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (error) {
            console.warn('BGM状態の保存に失敗しました:', error);
        }
    }

    function ensureAudioElement() {
        if (state.audio) {
            return state.audio;
        }

        const audio = document.createElement('audio');
        audio.id = 'bgm-audio';
        audio.loop = true;
        audio.preload = 'auto';
        audio.src = BGM_SRC;
        audio.volume = state.volume / 100;
        audio.setAttribute('data-bgm-managed', 'true');
        document.body.appendChild(audio);
        state.audio = audio;

        audio.addEventListener('timeupdate', () => {
            state.currentTime = audio.currentTime;
            writePersistedState();
        });

        audio.addEventListener('pause', () => {
            state.isPlaying = false;
            state.currentTime = audio.currentTime;
            writePersistedState();
        });

        audio.addEventListener('play', () => {
            state.isPlaying = true;
            state.currentTime = audio.currentTime;
            writePersistedState();
        });

        return audio;
    }

    function applyVolume(nextVolume) {
        const safeVolume = Math.max(0, Math.min(100, Number(nextVolume) || 0));
        state.volume = safeVolume;

        if (state.audio) {
            state.audio.volume = safeVolume / 100;
        }
        writePersistedState();
    }

    function play() {
        const audio = ensureAudioElement();
        const persistedState = readPersistedState();
        const nextCurrentTime = typeof persistedState?.currentTime === 'number'
            ? persistedState.currentTime
            : state.currentTime;

        state.currentTime = nextCurrentTime;
        audio.volume = state.volume / 100;
        audio.src = BGM_SRC;

        if (state.currentTime > 0 && Number.isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = Math.min(state.currentTime, audio.duration);
        }

        return audio.play().then(() => {
            state.isPlaying = true;
            state.currentTime = audio.currentTime;
            writePersistedState();
        }).catch((error) => {
            console.error('BGMの再生に失敗しました:', error);
            state.isPlaying = false;
            writePersistedState();
        });
    }

    function pause() {
        if (!state.audio) {
            return;
        }

        state.currentTime = state.audio.currentTime;
        state.audio.pause();
        state.isPlaying = false;
        writePersistedState();
    }

    function setVolume(nextVolume) {
        applyVolume(nextVolume);

        if (state.volume > 0) {
            return play();
        }

        pause();
        return Promise.resolve();
    }

    function initialize() {
        if (state.initialized) {
            return;
        }

        state.initialized = true;
        const persistedState = readPersistedState();
        if (persistedState && typeof persistedState.volume === 'number') {
            state.volume = persistedState.volume;
        }
        if (persistedState && typeof persistedState.currentTime === 'number') {
            state.currentTime = persistedState.currentTime;
        }

        const tryPlayOnInteraction = () => {
            document.removeEventListener('pointerdown', tryPlayOnInteraction);
            document.removeEventListener('keydown', tryPlayOnInteraction);
            document.removeEventListener('touchstart', tryPlayOnInteraction);

            if (state.volume > 0) {
                play();
            }
        };

        document.addEventListener('pointerdown', tryPlayOnInteraction, { once: true });
        document.addEventListener('keydown', tryPlayOnInteraction, { once: true });
        document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });

        if (persistedState && persistedState.isPlaying && state.volume > 0) {
            play();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    window.bgmManager = {
        initialize,
        play,
        pause,
        setVolume,
        getVolume: () => state.volume,
        getAudio: () => state.audio
    };
})();
