import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export interface EntityTab {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface EntityTabsProps {
  tabs: EntityTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function EntityTabs({ tabs, activeTab, onTabChange, className = "" }: EntityTabsProps) {
  const router = useRouter();
  const validTabIds = tabs.map(t => t.id);

  // If the activeTab is invalid, update the URL to the first valid tab
  useEffect(() => {
    if (!validTabIds.includes(activeTab)) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", validTabIds[0]);
      router.replace(url.pathname + url.search, { scroll: false });
      onTabChange(validTabIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, validTabIds]);

  // Update URL and notify parent when tab is clicked
  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      router.replace(url.pathname + url.search, { scroll: false });
      onTabChange(tabId);
    }
  };

  return (
    <div className={`entity-tabs grid grid-cols-${tabs.length} h-auto mt-0 bg-transparent ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`entity-tab inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium h-12 transition-colors ${activeTab === tab.id ? "border-b-2 border-primary" : ""} ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""} hover:bg-primary hover:text-white`}
          onClick={() => !tab.disabled && handleTabClick(tab.id)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
} 