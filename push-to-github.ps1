# Push to GitHub
# Note: If running from Cursor terminal fails with "unknown option trailer",
# run this in external terminal (e.g. Windows Terminal) or disable:
# Cursor Settings > Agents > Attribution

Set-Location $PSScriptRoot

# Commit if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    git add .
    git commit -m "chore: initial project setup with design document and cursor rules"
}

# Add remote if not exists
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    git remote add origin https://github.com/reason515/text-idle.git
}

# Push (use main or master based on default branch)
$branch = git branch --show-current
git push -u origin $branch

Write-Host "Done! Check https://github.com/reason515/text-idle"
