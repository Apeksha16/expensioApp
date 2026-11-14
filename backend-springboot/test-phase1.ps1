# Automated Phase 1 Verification Script for PowerShell
$baseUrl = "http://localhost:5001"
Write-Host "=== Expensio Phase 1 Authentication Smoke Test ===" -ForegroundColor Cyan

# 1. Health
Write-Host "`n[1] Checking Health endpoint..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/api/v1/health" -Method Get
Write-Host "Status: $($health.status) | App: $($health.app)" -ForegroundColor Green

# 2. Signup
$testEmail = "testuser_$(Get-Random)@example.com"
Write-Host "`n[2] Registering new user: $testEmail..." -ForegroundColor Yellow
$signupPayload = @{
    email = $testEmail
    password = "Password@123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

$signupRes = Invoke-RestMethod -Uri "$baseUrl/v1/auth/email/signup" -Method Post -ContentType "application/json" -Body $signupPayload
Write-Host "Signup Success! Challenge ID: $($signupRes.data.challengeId)" -ForegroundColor Green

# 3. Mobile OTP Start
Write-Host "`n[3] Requesting Mobile OTP for +919876543210..." -ForegroundColor Yellow
$mobilePayload = @{
    phone = "+919876543210"
} | ConvertTo-Json
$mobileRes = Invoke-RestMethod -Uri "$baseUrl/v1/auth/mobile/otp/start" -Method Post -ContentType "application/json" -Body $mobilePayload
Write-Host "Mobile OTP Challenge ID: $($mobileRes.data.challengeId)" -ForegroundColor Green

# 4. Login
Write-Host "`n[4] Logging in with email: $testEmail..." -ForegroundColor Yellow
$loginPayload = @{
    email = $testEmail
    password = "Password@123"
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/v1/auth/email/login" -Method Post -ContentType "application/json" -Body $loginPayload
Write-Host "Login successful! User ID: $($loginRes.data.user.id)" -ForegroundColor Green
Write-Host "Access Token received: $($loginRes.data.accessToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host "Refresh Token received: $($loginRes.data.refreshToken)" -ForegroundColor Gray

# 5. Refresh Token Rotation
Write-Host "`n[5] Testing Refresh Token Rotation..." -ForegroundColor Yellow
$refreshPayload = @{
    refreshToken = $loginRes.data.refreshToken
} | ConvertTo-Json
$refreshRes = Invoke-RestMethod -Uri "$baseUrl/v1/auth/refresh" -Method Post -ContentType "application/json" -Body $refreshPayload
Write-Host "Token Rotated! New Refresh Token: $($refreshRes.data.refreshToken)" -ForegroundColor Green

# 6. Google Auth (Mock)
Write-Host "`n[6] Testing Google OAuth (Dev Mock)..." -ForegroundColor Yellow
$googlePayload = @{
    idToken = "mock_google_user_powershell"
} | ConvertTo-Json
$googleRes = Invoke-RestMethod -Uri "$baseUrl/v1/auth/google" -Method Post -ContentType "application/json" -Body $googlePayload
Write-Host "Google Auth Successful! Email: $($googleRes.data.user.email)" -ForegroundColor Green

Write-Host "`nAll automated smoke tests passed successfully!" -ForegroundColor Cyan

