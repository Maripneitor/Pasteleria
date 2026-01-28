# 1. Login
$loginUrl = "http://localhost:3000/api/auth/login"
$loginBody = @{ email = "admin@lafiesta.com"; password = "Admin123!" } | ConvertTo-Json
try {
    Write-Host "Attempting Login..."
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ LOGIN SUCCESS. Token obtained."
} catch {
    Write-Host "❌ LOGIN FAILED: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    }
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# 2. Create User
$userUrl = "http://localhost:3000/api/users"
$userBody = @{
    username = "repostero_final_test"
    email = "test_final@repostero.com"
    password = "Password123!"
    globalRole = "USER"
} | ConvertTo-Json

try {
    Write-Host "Creating User..."
    $createUserResponse = Invoke-RestMethod -Uri $userUrl -Method Post -Body $userBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ CREATE USER SUCCESS: ID $($createUserResponse.id)"
} catch {
    Write-Host "⚠️ CREATE USER FAILED: $_"
    # Ignore duplicate
}

# 3. Create Folio
$folioUrl = "http://localhost:3000/api/folios"
$folioBody = @{
    tenantId = 1
    folioNumber = "TEST-" + (Get-Date -Format "HHmmss")
    tipo_folio = "Sencillo"
    fecha_entrega = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
    hora_entrega = "14:00"
    persons = 20
    cakeFlavorId = 1
    fillingId = 1
    descripcion_diseno = "Test Folio Validado"
    deliveryLocation = "Mostrador"
    total = 500.00
    clientId = 1
} | ConvertTo-Json

try {
    Write-Host "Creating Folio..."
    $createFolioResponse = Invoke-RestMethod -Uri $folioUrl -Method Post -Body $folioBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ CREATE FOLIO SUCCESS: ID $($createFolioResponse.data.id)"
} catch {
    Write-Host "❌ CREATE FOLIO FAILED: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}

# 4. Check API Route (Health Check)
try {
    Write-Host "Checking Health Check Endpoint..."
    $apiResponse = Invoke-RestMethod -Uri "http://localhost:3000/api" -Method Get
    if ($apiResponse.status -eq 'online') {
        Write-Host "✅ API HEALTH CHECK PASSED"
    } else {
        Write-Host "⚠️ API HEALTH CHECK UNEXPECTED RESPONSE: $($apiResponse | ConvertTo-Json)"
    }
} catch {
    Write-Host "❌ API HEALTH CHECK FAILED: $_"
}
