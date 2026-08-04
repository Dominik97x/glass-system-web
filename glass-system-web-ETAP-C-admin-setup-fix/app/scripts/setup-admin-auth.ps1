$ErrorActionPreference = "Stop"

function ConvertTo-PlainText {
  param([Parameter(Mandatory = $true)][Security.SecureString]$SecureString)

  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)

  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

$username = Read-Host "Nazwa uzytkownika administratora [admin]"

if ([string]::IsNullOrWhiteSpace($username)) {
  $username = "admin"
}

$passwordSecure = Read-Host "Haslo administratora (minimum 12 znakow)" -AsSecureString
$passwordConfirmationSecure = Read-Host "Powtorz haslo" -AsSecureString
$password = ConvertTo-PlainText $passwordSecure
$passwordConfirmation = ConvertTo-PlainText $passwordConfirmationSecure

if ($password -ne $passwordConfirmation) {
  throw "Podane hasla nie sa identyczne."
}

if ($password.Length -lt 12 -or $password.Length -gt 256) {
  throw "Haslo musi zawierac od 12 do 256 znakow."
}

try {
  $env:ADMIN_USERNAME_INPUT = $username.Trim()
  $env:ADMIN_PASSWORD_INPUT = $password

  $generatorOutput = & node scripts/generate-admin-auth-config.mjs

  if ($LASTEXITCODE -ne 0) {
    throw "Generator konfiguracji administratora zakonczyl sie bledem."
  }
}
finally {
  Remove-Item Env:ADMIN_USERNAME_INPUT -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_PASSWORD_INPUT -ErrorAction SilentlyContinue
  $password = $null
  $passwordConfirmation = $null
}

$configLines = @(
  $generatorOutput |
    Where-Object { $_ -match '^ADMIN_(USERNAME|PASSWORD_HASH|SESSION_SECRET|SESSION_TTL_HOURS)=' }
)

if ($configLines.Count -ne 4) {
  throw "Nie udalo sie odczytac wygenerowanej konfiguracji."
}

$envPath = Join-Path (Get-Location) ".env.local"
$existingContent = ""

if (Test-Path $envPath) {
  $existingContent = [IO.File]::ReadAllText($envPath, [Text.Encoding]::UTF8)
}

$cleanedContent = [regex]::Replace(
  $existingContent,
  '(?m)^ADMIN_(USERNAME|PASSWORD_HASH|SESSION_SECRET|SESSION_TTL_HOURS)=.*(?:\r?\n|$)',
  ''
).TrimEnd()

$adminSection = @"
# Administrator authentication.
$($configLines -join [Environment]::NewLine)
"@

if ($cleanedContent.Length -gt 0) {
  $newContent = $cleanedContent + [Environment]::NewLine + [Environment]::NewLine + $adminSection.Trim() + [Environment]::NewLine
}
else {
  $newContent = $adminSection.Trim() + [Environment]::NewLine
}

[IO.File]::WriteAllText(
  $envPath,
  $newContent,
  [Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "Konfiguracja administratora zostala zapisana w app/.env.local." -ForegroundColor Green
Write-Host "Uruchom ponownie npm run dev, aby wczytac nowe zmienne." -ForegroundColor Yellow
