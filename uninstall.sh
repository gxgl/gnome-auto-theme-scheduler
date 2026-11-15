#!/bin/bash
# Disable and remove the extension for the current user.
set -euo pipefail

UUID="auto-theme-scheduler@gxgl"
gnome-extensions disable "$UUID" 2>/dev/null || true
gnome-extensions uninstall "$UUID"
echo "Auto Theme Scheduler uninstalled."
