#!/usr/bin/env bash
set -euo pipefail

repo_owner="${KNB_REPO_OWNER:-ratacat}"
repo_name="${KNB_REPO_NAME:-knb}"
ref="${KNB_REF:-main}"
install_dir="${KNB_INSTALL_DIR:-$HOME/.knb/knb-cli}"
bin_name="${KNB_BIN_NAME:-knb}"
archive_url="${KNB_ARCHIVE_URL:-https://codeload.github.com/${repo_owner}/${repo_name}/tar.gz/${ref}}"
staging=""

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "knb install: missing required command: $1" >&2
    exit 1
  fi
}

path_has_dir() {
  case ":${PATH:-}:" in
    *":$1:"*) return 0 ;;
    *) return 1 ;;
  esac
}

choose_bin_dir() {
  if [[ -n "${KNB_BIN_DIR:-}" ]]; then
    printf '%s\n' "$KNB_BIN_DIR"
    return
  fi

  IFS=':' read -r -a path_dirs <<< "${PATH:-}"
  for dir in "${path_dirs[@]}"; do
    [[ -n "$dir" && -d "$dir" && -w "$dir" ]] || continue
    printf '%s\n' "$dir"
    return
  done

  if path_has_dir "/usr/local/bin"; then
    printf '%s\n' "/usr/local/bin"
    return
  fi

  printf '%s\n' "$HOME/.local/bin"
}

install_bun_if_needed() {
  if command -v bun >/dev/null 2>&1; then
    return
  fi

  need curl
  echo "knb install: Bun not found, installing Bun"
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"

  if ! command -v bun >/dev/null 2>&1; then
    echo "knb install: Bun installed, but bun is still not on PATH" >&2
    echo "Open a new shell and rerun the installer." >&2
    exit 1
  fi
}

copy_source() {
  local destination="$1"

  if [[ -n "${KNB_SOURCE_DIR:-}" ]]; then
    if [[ ! -d "$KNB_SOURCE_DIR" ]]; then
      echo "knb install: KNB_SOURCE_DIR does not exist: $KNB_SOURCE_DIR" >&2
      exit 1
    fi
    tar \
      --exclude ".git" \
      --exclude "node_modules" \
      --exclude "dist" \
      --exclude "coverage" \
      -cf - \
      -C "$KNB_SOURCE_DIR" . | tar -xf - -C "$destination"
    return
  fi

  need curl
  need tar
  curl -fsSL "$archive_url" | tar -xz --strip-components=1 -C "$destination"
}

write_launcher() {
  local launcher_path="$1"
  local tmp_launcher
  local quoted_install_dir
  tmp_launcher="$(mktemp)"
  quoted_install_dir="$(printf "%q" "$install_dir")"

  cat > "$tmp_launcher" <<EOF
#!/usr/bin/env bash
set -euo pipefail

install_dir=${quoted_install_dir}
if ! command -v bun >/dev/null 2>&1; then
  export BUN_INSTALL="\${BUN_INSTALL:-\$HOME/.bun}"
  export PATH="\$BUN_INSTALL/bin:\$PATH"
fi

exec bun run "\$install_dir/src/cli.ts" "\$@"
EOF

  chmod 0755 "$tmp_launcher"

  if [[ -d "$(dirname "$launcher_path")" && -w "$(dirname "$launcher_path")" ]]; then
    mv "$tmp_launcher" "$launcher_path"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo mkdir -p "$(dirname "$launcher_path")"
    sudo mv "$tmp_launcher" "$launcher_path"
    sudo chmod 0755 "$launcher_path"
    return
  fi

  echo "knb install: cannot write launcher to $launcher_path" >&2
  echo "Set KNB_BIN_DIR to a writable directory on PATH and rerun." >&2
  rm -f "$tmp_launcher"
  exit 1
}

main() {
  install_bun_if_needed
  need mktemp

  staging="$(mktemp -d)"
  trap 'rm -rf "$staging"' EXIT

  mkdir -p "$install_dir"
  copy_source "$staging"

  find "$install_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -R "$staging/." "$install_dir"

  (
    cd "$install_dir"
    bun install --frozen-lockfile
  )

  local bin_dir
  bin_dir="$(choose_bin_dir)"
  mkdir -p "$bin_dir" 2>/dev/null || true

  local launcher_path="$bin_dir/$bin_name"
  write_launcher "$launcher_path"

  if ! path_has_dir "$bin_dir"; then
    echo "knb install: installed $bin_name to $launcher_path"
    echo "knb install: $bin_dir is not on PATH; add it before running $bin_name."
    exit 0
  fi

  echo "knb install: installed $bin_name to $launcher_path"
  "$launcher_path" --help >/dev/null
  echo "knb install: ok"
}

main "$@"
