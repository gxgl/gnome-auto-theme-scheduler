// SPDX-License-Identifier: GPL-2.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const CREDITS = [
    {
        title: 'Theme Scheduler',
        url: 'https://github.com/lsantiagoba/ThemeScheduler',
    },
    {
        title: 'Gtk3 Auto Dark',
        url: 'https://codeberg.org/swsnr/gnome-shell-extension-gtk3-auto-dark',
    },
];

export default class AutoThemeSchedulerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this.initTranslations();
        const _ = this.gettext.bind(this);
        const settings = this.getSettings();
        window.set_default_size(620, 600);
        // Keep the settings object alive for as long as the window exists.
        window._settings = settings;

        const schedulePage = new Adw.PreferencesPage({
            title: _('Schedule'),
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(schedulePage);

        const scheduleGroup = new Adw.PreferencesGroup({
            title: _('Theme schedule'),
            description: _('Times use your computer’s local clock and the 24-hour format.'),
        });
        schedulePage.add(scheduleGroup);
        scheduleGroup.add(this._createTimeRow(settings, _('Light theme starts'), 'light-hour', 'light-minute'));
        scheduleGroup.add(this._createTimeRow(settings, _('Dark theme starts'), 'dark-hour', 'dark-minute'));

        const noteGroup = new Adw.PreferencesGroup();
        noteGroup.add(new Adw.ActionRow({
            title: _('Changes are automatic'),
            subtitle: _('The current theme is updated as soon as you change either time.'),
        }));
        noteGroup.add(new Adw.ActionRow({
            title: _('Manual changes are kept'),
            subtitle: _('If you switch the style manually, it stays until the next scheduled time.'),
        }));
        schedulePage.add(noteGroup);

        const legacyGroup = new Adw.PreferencesGroup({title: _('Legacy applications')});
        const gtk3Row = new Adw.SwitchRow({
            title: _('Dark theme for GTK3 applications'),
            subtitle: _('Use Adwaita-dark for GTK3 applications while the dark style is active and restore the previous theme afterwards.'),
        });
        settings.bind('gtk3-dark-enabled', gtk3Row, 'active', Gio.SettingsBindFlags.DEFAULT);
        legacyGroup.add(gtk3Row);
        schedulePage.add(legacyGroup);

        const aboutPage = new Adw.PreferencesPage({
            title: _('About'),
            icon_name: 'help-about-symbolic',
        });
        window.add(aboutPage);

        const aboutGroup = new Adw.PreferencesGroup({
            title: this.metadata.name,
            description: `${this.metadata['version-name'] ?? ''}`,
        });
        aboutGroup.add(this._createLinkRow(window, _('Source code'), this.metadata.url));
        aboutPage.add(aboutGroup);

        const creditsGroup = new Adw.PreferencesGroup({
            title: _('Credits'),
            description: _('This extension combines and modernizes the following projects.'),
        });
        for (const {title, url} of CREDITS)
            creditsGroup.add(this._createLinkRow(window, title, url));
        aboutPage.add(creditsGroup);
    }

    _createTimeRow(settings, title, hourKey, minuteKey) {
        const row = new Adw.ActionRow({title});
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            valign: Gtk.Align.CENTER,
        });
        box.append(this._createTimeSpinButton(settings, hourKey, 23, 1));
        box.append(new Gtk.Label({label: ':'}));
        box.append(this._createTimeSpinButton(settings, minuteKey, 59, 5));
        row.add_suffix(box);
        return row;
    }

    _createTimeSpinButton(settings, key, upper, pageIncrement) {
        const spinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper,
                step_increment: 1,
                page_increment: pageIncrement,
            }),
            numeric: true,
            wrap: true,
            width_chars: 2,
            valign: Gtk.Align.CENTER,
        });
        // Show times as 07:05 rather than 7:5.
        spinButton.connect('output', () => {
            spinButton.set_text(spinButton.get_value_as_int().toString().padStart(2, '0'));
            return true;
        });
        settings.bind(key, spinButton, 'value', Gio.SettingsBindFlags.DEFAULT);
        return spinButton;
    }

    _createLinkRow(window, title, url) {
        const row = new Adw.ActionRow({
            title,
            subtitle: url.replace(/^https:\/\//, ''),
            activatable: true,
        });
        row.add_suffix(new Gtk.Image({icon_name: 'external-link-symbolic'}));
        row.connect('activated', () => {
            new Gtk.UriLauncher({uri: url}).launch(window, null, null);
        });
        return row;
    }
}
