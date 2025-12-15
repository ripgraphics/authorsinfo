# Script to add environment variables to Vercel
# Run this script to add all required env vars

$envVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "https://nmrohtlcfqujtfgcyqhw.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcm9odGxjZnF1anRmZ2N5cWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTQ1ODIsImV4cCI6MjA1Nzg5MDU4Mn0.kpkM45hzALxly1EP86tEP4QfWJS8cOEys4zkSmZVIyU"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcm9odGxjZnF1anRmZ2N5cWh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMxNDU4MiwiZXhwIjoyMDU3ODkwNTgyfQ.A6yFi6IQWp_PFRkBpWz7-eDpDSnBsmrxn_WaQYJzTQk"
    "CLOUDINARY_CLOUD_NAME" = "dj8yugwyp"
    "CLOUDINARY_API_KEY" = "135577636151346"
    "CLOUDINARY_API_SECRET" = "tIxbatMTI8UwMu-HYZkMrhm9gcc"
    "ISBNDB_API_KEY" = "60094_0ac53896f9113d617c74891b5138f02f"
    "NEXT_PUBLIC_ISBNDB_API_KEY" = "60094_0ac53896f9113d617c74891b5138f02f"
}

Write-Host "Adding environment variables to Vercel..."
Write-Host "You will need to confirm each one interactively."
Write-Host ""

$environments = @("production", "preview", "development")

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    foreach ($env in $environments) {
        Write-Host "Adding $key to $env..."
        echo $value | vercel env add $key $env
        Write-Host ""
    }
}

Write-Host "Done! All environment variables have been added."

