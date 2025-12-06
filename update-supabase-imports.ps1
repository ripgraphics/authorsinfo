# Script to update all Supabase imports from deprecated auth-helpers-nextjs to @supabase/ssr
$files = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx -Exclude node_modules | 
    Where-Object { $_.FullName -notmatch 'node_modules' }

$updated = 0
$errors = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    # Replace createRouteHandlerClient imports and usage
    if ($content -match "createRouteHandlerClient.*@supabase/auth-helpers-nextjs") {
        $content = $content -replace "import\s+\{\s*createRouteHandlerClient\s*\}\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'"
        $content = $content -replace "import\s+createRouteHandlerClient\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'"
        $content = $content -replace "createRouteHandlerClient\(\s*\{\s*cookies\s*\}\s*\)", "await createRouteHandlerClientAsync()"
        $content = $content -replace "import\s+\{\s*cookies\s*\}\s+from\s+'next/headers'", ""
        $changed = $true
    }
    
    # Replace createServerComponentClient imports and usage
    if ($content -match "createServerComponentClient.*@supabase/auth-helpers-nextjs") {
        $content = $content -replace "import\s+\{\s*createServerComponentClient\s*\}\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'"
        $content = $content -replace "import\s+createServerComponentClient\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createServerComponentClientAsync } from '@/lib/supabase/client-helper'"
        $content = $content -replace "createServerComponentClient\(\s*\{\s*cookies\s*\}\s*\)", "await createServerComponentClientAsync()"
        $content = $content -replace "import\s+\{\s*cookies\s*\}\s+from\s+'next/headers'", ""
        $changed = $true
    }
    
    # Replace createServerActionClient imports and usage
    if ($content -match "createServerActionClient.*@supabase/auth-helpers-nextjs") {
        $content = $content -replace "import\s+\{\s*createServerActionClient\s*\}\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createServerActionClientAsync } from '@/lib/supabase/client-helper'"
        $content = $content -replace "import\s+createServerActionClient\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createServerActionClientAsync } from '@/lib/supabase/client-helper'"
        $content = $content -replace "createServerActionClient\(\s*\{\s*cookies\s*\}\s*\)", "await createServerActionClientAsync()"
        $content = $content -replace "import\s+\{\s*cookies\s*\}\s+from\s+'next/headers'", ""
        $changed = $true
    }
    
    # Replace createClientComponentClient imports and usage (for client components)
    if ($content -match "createClientComponentClient.*@supabase/auth-helpers-nextjs") {
        $content = $content -replace "import\s+\{\s*createClientComponentClient\s*\}\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createBrowserClient } from '@supabase/ssr'"
        $content = $content -replace "import\s+createClientComponentClient\s+from\s+'@supabase/auth-helpers-nextjs'", "import { createBrowserClient } from '@supabase/ssr'"
        # Replace usage - need to handle with Database type
        $content = $content -replace "createClientComponentClient<Database>\(\)", "createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)"
        $content = $content -replace "createClientComponentClient\(\)", "createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)"
        $changed = $true
    }
    
    if ($changed -and $content -ne $originalContent) {
        try {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "Updated: $($file.FullName)"
            $updated++
        } catch {
            Write-Host "Error updating $($file.FullName): $_" -ForegroundColor Red
            $errors++
        }
    }
}

Write-Host "`nUpdate complete: $updated files updated, $errors errors" -ForegroundColor Green


