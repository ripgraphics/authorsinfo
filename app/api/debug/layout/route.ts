import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const authorPagePath = path.join(process.cwd(), "app", "authors", "[id]", "page.tsx");
    const profileEditPagePath = path.join(process.cwd(), "app", "profile", "edit", "page.tsx");
    
    const authorPageContent = fs.existsSync(authorPagePath) 
      ? fs.readFileSync(authorPagePath, 'utf8')
      : "File not found";
      
    const profileEditPageContent = fs.existsSync(profileEditPagePath) 
      ? fs.readFileSync(profileEditPagePath, 'utf8')
      : "File not found";
    
    return NextResponse.json({
      authorPage: {
        exists: fs.existsSync(authorPagePath),
        contentLength: authorPageContent.length,
        pageHeaderUsage: authorPageContent.includes("<PageHeader"),
        pageContainerUsage: authorPageContent.includes("<PageContainer"),
      },
      profileEditPage: {
        exists: fs.existsSync(profileEditPagePath),
        contentLength: profileEditPageContent.length,
        pageHeaderUsage: profileEditPageContent.includes("<PageHeader"),
        pageContainerUsage: profileEditPageContent.includes("<PageContainer"),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze layout" }, { status: 500 });
  }
} 