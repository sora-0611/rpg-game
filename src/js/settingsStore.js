(function () {
    const STORAGE_KEY = 'rpg-game-settings';

    const DEFAULT_SETTINGS = {
        bgmVolume: 100,
        fullscreen: false
    };

    const state = {
        settings: { ...DEFAULT_SETTINGS }
    };
    let fullscreenRequestPending = false;

    function requestFullscreenFromUserGesture() {
        if (!state.settings.fullscreen || document.fullscreenElement || fullscreenRequestPending) {
            return;
        }

        requestFullscreenIfNeeded();
    }

    function cloneSettings(settings) {
        return {
            ...DEFAULT_SETTINGS,
            ...(settings || {})
        };
    }

    function readSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return cloneSettings(DEFAULT_SETTINGS);
            }

            const parsed = JSON.parse(raw);
            return cloneSettings(parsed);
        } catch (error) {
            console.warn('設定の読み込みに失敗しました:', error);
            return cloneSettings(DEFAULT_SETTINGS);
        }
    }

    function persistSettings(nextSettings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
        } catch (error) {
            console.warn('設定の保存に失敗しました:', error);
        }
    }

    function requestFullscreenIfNeeded() {
        if (!document.fullscreenEnabled || !state.settings.fullscreen || document.fullscreenElement || fullscreenRequestPending) {
            return;
        }

        fullscreenRequestPending = true;
        document.documentElement.requestFullscreen().catch(() => {
            fullscreenRequestPending = false;
            persistSettings(state.settings);
        }).then(() => {
            fullscreenRequestPending = false;
            persistSettings(state.settings);
        });
    }

    function applyFullscreen(fullscreenEnabled, options = {}) {
        if (!document.fullscreenEnabled) {
            return;
        }

        if (fullscreenEnabled) {
            if (options.allowAutoRequest === false) {
                return;
            }
            requestFullscreenIfNeeded();
        } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
                persistSettings(state.settings);
            });
        }
    }

    function applySettings(nextSettings, options = {}) {
        const incomingSettings = cloneSettings(nextSettings);
        const resolvedSettings = {
            ...state.settings,
            ...incomingSettings
        };

        state.settings = resolvedSettings;
        persistSettings(resolvedSettings);

        if (typeof window.bgmManager?.setVolume === 'function') {
            window.bgmManager.setVolume(resolvedSettings.bgmVolume);
        }

        if (options.applyFullscreen !== false) {
            applyFullscreen(Boolean(resolvedSettings.fullscreen), { allowAutoRequest: options.allowAutoRequest !== false });
        }
        window.dispatchEvent(new CustomEvent('settings:changed', { detail: resolvedSettings }));
    }

    function updateSetting(key, value) {
        state.settings[key] = value;
        applySettings(state.settings);
    }

    function initialize() {
        const loadedSettings = readSettings();
        state.settings = {
            ...DEFAULT_SETTINGS,
            ...state.settings,
            ...loadedSettings
        };
        applySettings(state.settings, { applyFullscreen: false });
    }

    window.addEventListener('pageshow', () => {
        if (state.settings.fullscreen && !document.fullscreenElement) {
            requestFullscreenFromUserGesture();
        }
    });

    document.addEventListener('pointerdown', requestFullscreenFromUserGesture, { once: true, capture: true });
    document.addEventListener('keydown', requestFullscreenFromUserGesture, { once: true, capture: true });
    document.addEventListener('touchstart', requestFullscreenFromUserGesture, { once: true, capture: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    window.settingsStore = {
        getSettings: () => ({ ...state.settings }),
        updateSetting,
        applySettings,
        initialize,
        readSettings,
        persistSettings
    };
    window.gameSettings = state.settings;
})();
