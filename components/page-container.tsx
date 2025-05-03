import React from "react";
import { PageHeader } from "@/components/page-header";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
} 