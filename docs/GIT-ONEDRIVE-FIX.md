# Git + OneDrive: "Unlink of file .git/objects/pack failed"

## Why it happens

Repo is inside **OneDrive** (`OneDrive\all app\Astro-App`).  
OneDrive locks/syncs files under `.git/`. When Git tries to replace a pack file it cannot delete the old one → prompt:

```text
Unlink of file '.git/objects/pack/pack-....idx' failed. Should I try again? (y/n)
```

## Right now (prompt pe kya dabao)

1. Type **`n`** (No) — do not spam **y**
2. Run: `git status` and `git log -1`
3. Often commit **already succeeded** even if unlink failed

## Permanent fixes (pick one)

### Best: Project OneDrive ke bahar rakho

```text
C:\dev\Astro-App
```

Copy/move folder out of OneDrive, then `git status` there.  
No more pack unlink errors.

### Good: OneDrive se `.git` free rakho

1. OneDrive tray → **Pause syncing** (2 hours) before big commits  
2. Or mark project **Always keep on this device** (not online-only)

### Already applied in this repo

- `gc.auto = 0` (no auto repack that unlinks packs)
- `core.autocrlf = true` (less LF/CRLF noise)
- `pack.threads = 1`
- `.gitattributes` for line endings
- Use **`GIT-SAFE-COMMIT.bat`** for commits

## Safe commit command

Double-click:

```text
GIT-SAFE-COMMIT.bat
```

Or:

```powershell
cd "C:\Users\hi\OneDrive\all app\Astro-App"
git add -A
git -c core.fsync=none commit -m "your message"
```

If unlink still appears → answer **n**, then `git log -1` to confirm commit.

## Do NOT

- Run `git init` again in this folder (already a repo)
- Answer **y** many times on unlink (makes OneDrive worse)
- Run `git gc` while OneDrive is actively syncing
