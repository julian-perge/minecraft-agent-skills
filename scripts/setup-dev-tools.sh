#!/usr/bin/env bash
set -euo pipefail

PASS='[PASS]'
WARN='[WARN]'
FAIL='[FAIL]'

echo "=== Setup Dev Tools ==="

OS="$(uname -s)"

need_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1
}

install_with_apt() {
  sudo apt-get update
  sudo apt-get install -y jq
}

install_with_brew() {
  brew install jq
}

if ! need_cmd node || ! need_cmd bun; then
  echo "$FAIL Node 22+ and bun 1.4.4+ are required but were not found on PATH."
  echo "$WARN Install Node 22+ with nvm, fnm, Volta, Homebrew, or NodeSource, install bun 1.4.4 or later from https://bun.sh, then rerun."
  exit 1
fi

if need_cmd jq; then
  echo "$PASS Required support tool already installed: jq"
else
  echo "[INFO] Installing missing support tools..."
  case "$OS" in
    Linux)
      if need_cmd apt-get; then
        install_with_apt
      else
        echo "$FAIL Unsupported Linux package manager. Install manually: jq"
        exit 1
      fi
      ;;
    Darwin)
      if need_cmd brew; then
        install_with_brew
      else
        echo "$FAIL Homebrew is required on macOS. Install brew, then rerun."
        exit 1
      fi
      ;;
    *)
      echo "$FAIL Unsupported OS: $OS"
      echo "$WARN Install manually: jq, node, bun"
      exit 1
      ;;
  esac
fi

for cmd in jq node bun; do
  if need_cmd "$cmd"; then
    ver="$($cmd --version 2>/dev/null | head -n 1 || true)"
    echo "$PASS $cmd ${ver}"
  else
    echo "$FAIL Missing required command after setup: $cmd"
    exit 1
  fi
done

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [[ -z "$node_major" || "$node_major" -lt 22 ]]; then
  echo "$FAIL Node 22+ is required, but found $(node --version 2>/dev/null || echo missing)"
  echo "$WARN Install Node 22+ with nvm, fnm, Volta, Homebrew, or NodeSource, then rerun."
  exit 1
fi

bun_version="$(bun --version 2>/dev/null || echo 0.0.0)"
if [[ "${bun_version%%-*}" =~ ^([0-9]+)\.([0-9]+)(\.([0-9]+))?$ ]]; then
  bun_major="${BASH_REMATCH[1]}"
  bun_minor="${BASH_REMATCH[2]}"
  bun_patch="${BASH_REMATCH[4]:-0}"
else
  bun_major=0 bun_minor=0 bun_patch=0
fi
if (( bun_major < 1 || (bun_major == 1 && bun_minor < 4) || (bun_major == 1 && bun_minor == 4 && bun_patch < 4) )); then
  echo "$FAIL bun 1.4.4+ is required, but found $bun_version"
  echo "$WARN Install bun 1.4.4 or later from https://bun.sh, then rerun."
  exit 1
fi

echo ""
echo "$PASS Dev tools are ready"
