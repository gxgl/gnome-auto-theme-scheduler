// SPDX-License-Identifier: GPL-2.0-or-later
//
// Auto Theme Scheduler: switches GNOME's color scheme at scheduled times and
// keeps legacy GTK3 applications in sync with the dark style.

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const CHECK_INTERVAL_SECONDS = 30;
const SCHEDULE_KEYS = ['light-hour', 'light-minute', 'dark-hour', 'dark-minute'];

const LIGHT_SCHEME = 'prefer-light';
const DARK_SCHEME = 'prefer-dark';
const GTK3_DARK_THEME = 'Adwaita-dark';

/**
 * Returns the most recent local time, not later than `now`, at which the
 * given hour and minute occurred (today or yesterday).
 *
 * @param {GLib.DateTime} now
 * @param {number} hour
 * @param {number} minute
 * @returns {GLib.DateTime}
 */
function lastOccurrence(now, hour, minute) {
    const today = GLib.DateTime.new_local(
        now.get_year(), now.get_month(), now.get_day_of_month(), hour, minute, 0);
    return today.compare(now) > 0 ? today.add_days(-1) : today;
}

/**
 * Determines which scheduled switch is currently in effect.
 *
 * The most recently passed start time wins, which also covers schedules that
 * cross midnight (for example dark at 19:00 and light at 07:00). When both
 * start times are equal, the light style wins.
 *
 * @param {Gio.Settings} settings The extension settings
 * @returns {{scheme: string, time: number}} The color scheme and the Unix
 *   time at which it was scheduled to start
 */
function currentScheduledSwitch(settings) {
    const now = GLib.DateTime.new_now_local();
    const light = lastOccurrence(now,
        settings.get_int('light-hour'), settings.get_int('light-minute'));
    const dark = lastOccurrence(now,
        settings.get_int('dark-hour'), settings.get_int('dark-minute'));

    return dark.compare(light) > 0
        ? {scheme: DARK_SCHEME, time: dark.to_unix()}
        : {scheme: LIGHT_SCHEME, time: light.to_unix()};
}

export default class AutoThemeSchedulerExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._interfaceSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});

        this._settingsHandlerIds = [
            ...SCHEDULE_KEYS.map(key => this._settings.connect(
                `changed::${key}`, () => this._applySchedule({force: true}))),
            this._settings.connect('changed::gtk3-dark-enabled', () => this._syncGtk3Theme()),
        ];
        this._interfaceHandlerId = this._interfaceSettings.connect(
            'changed::color-scheme', () => this._syncGtk3Theme());

        this._applySchedule({force: false});
        this._syncGtk3Theme();

        // Poll instead of arming a timer for the next switch: GLib timeouts
        // use the monotonic clock, which does not advance during suspend.
        this._timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT, CHECK_INTERVAL_SECONDS, () => {
                this._applySchedule({force: false});
                return GLib.SOURCE_CONTINUE;
            });
    }

    disable() {
        // The themes are left as they are: GNOME disables extensions on the
        // lock screen, and restoring here would flip all applications each time.
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        for (const id of this._settingsHandlerIds ?? [])
            this._settings.disconnect(id);
        this._settingsHandlerIds = null;
        if (this._interfaceHandlerId) {
            this._interfaceSettings.disconnect(this._interfaceHandlerId);
            this._interfaceHandlerId = 0;
        }
        this._interfaceSettings = null;
        this._settings = null;
    }

    /**
     * Applies the scheduled color scheme.
     *
     * Unless forced, the scheme is applied only once per scheduled switch, so
     * a manual change made afterwards is kept until the next scheduled time.
     *
     * @param {{force: boolean}} options
     */
    _applySchedule({force}) {
        const {scheme, time} = currentScheduledSwitch(this._settings);
        if (!force && this._settings.get_int64('last-scheduled-switch') === time)
            return;

        this._settings.set_int64('last-scheduled-switch', time);
        if (this._interfaceSettings.get_string('color-scheme') !== scheme)
            this._interfaceSettings.set_string('color-scheme', scheme);
    }

    /**
     * Uses the dark GTK3 theme while the dark style is active, and restores
     * the previous GTK3 theme otherwise.
     */
    _syncGtk3Theme() {
        const wantDark = this._settings.get_boolean('gtk3-dark-enabled') &&
            this._interfaceSettings.get_string('color-scheme') === DARK_SCHEME;
        const applied = this._settings.get_boolean('gtk3-dark-applied');
        const currentTheme = this._interfaceSettings.get_string('gtk-theme');

        if (wantDark) {
            if (!applied) {
                // An empty string means the user never chose a theme, so the
                // system default is restored later. A leftover dark theme is
                // treated the same way, so it does not stick in light mode.
                const userTheme = this._interfaceSettings.get_user_value('gtk-theme')?.unpack() ?? '';
                this._settings.set_string('gtk3-previous-theme',
                    userTheme === GTK3_DARK_THEME ? '' : userTheme);
                this._settings.set_boolean('gtk3-dark-applied', true);
            }
            if (currentTheme !== GTK3_DARK_THEME)
                this._interfaceSettings.set_string('gtk-theme', GTK3_DARK_THEME);
            return;
        }

        if (!applied)
            return;

        // Only restore if the user did not pick another theme in the meantime.
        if (currentTheme === GTK3_DARK_THEME) {
            const previousTheme = this._settings.get_string('gtk3-previous-theme');
            if (previousTheme)
                this._interfaceSettings.set_string('gtk-theme', previousTheme);
            else
                this._interfaceSettings.reset('gtk-theme');
        }
        this._settings.set_boolean('gtk3-dark-applied', false);
        this._settings.reset('gtk3-previous-theme');
    }
}
