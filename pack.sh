#!/bin/bash
# Pack the extension into a ZIP file that `gnome-extensions install` accepts.
set -euo pipefail

cd "$(dirname "$0")"
UUID="auto-theme-scheduler@gxgl"

gnome-extensions pack . \
    --schema="schemas/org.gnome.shell.extensions.auto-theme-scheduler.gschema.xml" \
    --podir="po" \
    --extra-source="LICENSE" \
    --force --out-dir=.
echo "Created $UUID.shell-extension.zip"
