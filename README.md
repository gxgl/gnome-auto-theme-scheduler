# Auto Theme Scheduler

GNOME Shell extension that switches the system style between light and dark at
the times you choose, and keeps legacy GTK3 applications in sync with it.

## Features

- Separate start times for the light and dark styles, using the local clock.
  Schedules that cross midnight are supported.
- Manual changes are respected: if you switch the style yourself (for example
  from Quick Settings), it stays until the next scheduled time, also across the
  lock screen and restarts.
- Optional dark theme for GTK3 applications: while the dark style is active,
  GTK3 applications use `Adwaita-dark`. Your previous GTK3 theme is restored
  when the light style returns or when the option is turned off.
- Supports GNOME Shell 45 to 51.
- Localized in Arabic, Chinese, English, French, German, Italian, Japanese,
  Korean, Portuguese, Romanian, Russian, and Spanish.

## Install

```bash
./install.sh
```

On Wayland, log out and back in after the first installation, then enable the
extension in the Extensions app. Set the start times in its preferences.

## Package

```bash
./pack.sh
```

This creates `auto-theme-scheduler@gxgl.shell-extension.zip`.

## Uninstall

```bash
./uninstall.sh
```

Uninstalling does not change the current style or GTK3 theme.

## Translations

Translatable strings live in `prefs.js`. To refresh the template after changing
them:

```bash
xgettext --from-code=UTF-8 -L JavaScript -k_ \
    -o po/auto-theme-scheduler@gxgl.pot prefs.js
for po in po/*.po; do msgmerge --update "$po" po/auto-theme-scheduler@gxgl.pot; done
```

## Credits

This extension combines and modernizes:

- [Theme Scheduler](https://github.com/lsantiagoba/ThemeScheduler) by Leandro Santiago
- [Gtk3 Auto Dark](https://codeberg.org/swsnr/gnome-shell-extension-gtk3-auto-dark) by Sebastian Wiesner

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
