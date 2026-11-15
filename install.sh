#!/bin/bash
# Pack and install the extension for the current user.
set -euo pipefail

cd "$(dirname "$0")"
UUID="auto-theme-scheduler@gxgl"
SHELL_VERSION=$(gnome-shell --version | awk '{split($3, version, "."); print version[1]}')

if [ "$SHELL_VERSION" -lt 45 ]; then
    echo "Auto Theme Scheduler requires GNOME Shell 45 or newer." >&2
    exit 1
fi

./pack.sh
gnome-extensions install --force "$UUID.shell-extension.zip"
# Make sure the settings schema is compiled on every supported GNOME version.
glib-compile-schemas "$HOME/.local/share/gnome-shell/extensions/$UUID/schemas"
if gnome-extensions enable "$UUID" 2>/dev/null; then
    echo "Auto Theme Scheduler installed and enabled."
else
    echo "Auto Theme Scheduler installed. Log out and back in, then run:"
    echo "  gnome-extensions enable $UUID"
fi
