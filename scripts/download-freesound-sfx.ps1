# Download original CC0 combat SFX from Freesound into frontend/public/audio/sfx/.
# Requires .env with FREESOUND_CLIENT_ID, FREESOUND_API_KEY, FREESOUND_REFRESH_TOKEN.
# Sound IDs match docs/audio-attributions.md.

param(
    [string]$EnvFile = (Join-Path (Split-Path $PSScriptRoot -Parent) '.env')
)

function Read-DotEnv($path) {
    $vars = @{}
    if (-not (Test-Path $path)) {
        throw "Missing $path - copy .env.example and add Freesound credentials."
    }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        $i = $line.IndexOf('=')
        if ($i -lt 1) { return }
        $k = $line.Substring(0, $i).Trim()
        $v = $line.Substring($i + 1).Trim()
        $vars[$k] = $v
    }
    return $vars
}

$envVars = Read-DotEnv $EnvFile
$clientId = $envVars['FREESOUND_CLIENT_ID']
$apiKey = $envVars['FREESOUND_API_KEY']
$refresh = $envVars['FREESOUND_REFRESH_TOKEN']
if (-not $clientId -or -not $apiKey -or -not $refresh) {
    throw 'Set FREESOUND_CLIENT_ID, FREESOUND_API_KEY, FREESOUND_REFRESH_TOKEN in .env'
}

$tokenResp = Invoke-RestMethod -Method Post -Uri 'https://freesound.org/apiv2/oauth2/access_token/' -Body @{
    client_id     = $clientId
    client_secret = $apiKey
    grant_type    = 'refresh_token'
    refresh_token = $refresh
}

$newRefresh = $tokenResp.refresh_token
if ($newRefresh -and $newRefresh -ne $refresh) {
    Write-Host 'Note: refresh_token rotated; update FREESOUND_REFRESH_TOKEN in .env'
}

$accessToken = $tokenResp.access_token
$headers = @{ Authorization = "Bearer $accessToken" }
$dst = Join-Path (Split-Path $PSScriptRoot -Parent) 'frontend\public\audio\sfx'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

$files = [ordered]@{
    fs_phys_hit   = 547042
    fs_phys_crit  = 591155
    fs_magic_hit  = 442774
    fs_magic_crit = 570855
    fs_dodge      = 9509
    fs_encounter       = 683184
    fs_encounter_boss  = 752582
    fs_dot_phys   = 495117
    fs_dot_magic  = 827664
    fs_hero_death      = 808092
    fs_monster_death   = 249813
    fs_victory    = 844831
    fs_defeat     = 253174
    fs_skill_fire   = 431174
    fs_skill_frost  = 683180
    fs_skill_heal   = 562292
    fs_skill_sunder = 812592
    fs_skill_shield = 570853
    fs_level_up     = 442943
    fs_loot_drop    = 735168
    fs_map_elwynn       = 624092
    fs_map_westfall     = 348190
    fs_map_duskwood     = 578362
    fs_map_redridge     = 578376
    fs_map_stranglethorn = 161470
}

foreach ($entry in $files.GetEnumerator()) {
    $name = $entry.Key
    $id = $entry.Value
    $meta = Invoke-RestMethod -Uri "https://freesound.org/apiv2/sounds/$id/?token=$apiKey" -Headers $headers
    $ext = if ($meta.type -match 'ogg') { '.ogg' } elseif ($meta.type -match 'flac') { '.flac' } else { '.wav' }
    $out = Join-Path $dst ($name + $ext)
    Invoke-WebRequest -Uri "https://freesound.org/apiv2/sounds/$id/download/" -Headers $headers -OutFile $out -UseBasicParsing
    Write-Host "OK $name -> $(Split-Path $out -Leaf) ($((Get-Item $out).Length) bytes)"
}

Write-Host "Done. Total ~$((Get-ChildItem $dst -Filter 'fs_*.*' | Measure-Object Length -Sum).Sum) bytes in $dst"
Write-Host 'Note: fs_skill_taunt.mp3 is not in OAuth list; copy CC0 HQ preview from Freesound 547203 if missing.'
