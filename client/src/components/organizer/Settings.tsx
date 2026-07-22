import { useState } from "react";
import { ProfileTab } from "./ProfileTab";
import { ProfilePanel } from "./ProiflePanel";

type SettingsTab = "account" | "brand";

export const SettingsPanel = () => {
  const [view, setView] = useState<SettingsTab>("account");

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex w-fit border border-border">
        <button
          onClick={() => setView("account")}
          className={`px-4 py-2 text-[11px] uppercase font-medium transition-colors ${
            view === "account"
              ? "bg-foreground text-background"
              : "bg-background hover:bg-muted"
          }`}
        >
          Account
        </button>

        <button
          onClick={() => setView("brand")}
          className={`px-4 py-2 text-[11px] uppercase font-medium border-l border-border transition-colors ${
            view === "brand"
              ? "bg-foreground text-background"
              : "bg-background hover:bg-muted"
          }`}
        >
          Brand Profile
        </button>
      </div>

      {/* Content */}
      {view === "account" ? <ProfileTab /> : <ProfilePanel />}
    </div>
  );
};