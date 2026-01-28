$registerUrl = "http://localhost:3000/api/auth/register"
$body = @{
    username = "superadmin2"
    email = "admin2@test.com"
    password = "1234"
    globalRole = "ADMIN"
    name = "Super Admin"
} | ConvertTo-Json

try {
    Write-Host "Creating Superadmin..."
    $response = Invoke-RestMethod -Uri $registerUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ SUPERADMIN CREATED"
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ FAILED TO CREATE SUPERADMIN: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    } else {
        Write-Host "Possible connection error. Check if server is running."
    }
}

# Health Check Verification
try {
    Write-Host "Verifying /api Health Check..."
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api" -Method Get
    Write-Host "✅ HEALTH CHECK: $($health.status) - $($health.message)"
} catch {
    Write-Host "❌ HEALTH CHECK FAILED: $_"
}
