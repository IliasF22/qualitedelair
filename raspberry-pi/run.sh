#!/usr/bin/env bash
# Lance l’envoi des capteurs (lit le fichier .env dans ce dossier).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
if [[ ! -d .venv ]]; then
  echo "Crée d’abord le venv : python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi
exec "$DIR/.venv/bin/python3" "$DIR/pi_sensor_sender.py" "$@"
