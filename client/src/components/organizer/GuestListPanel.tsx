// client/src/components/organizer/GuestListPanel.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useGuests, useRemoveGuest } from "@/hooks/api/useOrganizer";

interface Props { eventId: string | null; }

export const GuestListPanel: React.FC<Props> = ({ eventId }) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [checkedInFilter, setCheckedInFilter] = useState<"all" | "yes" | "no">("all");
  const { data: guests, isLoading } = useGuests(eventId, { dateFrom, dateTo });
  const removeGuest = useRemoveGuest(eventId);

  if (!eventId) return <div className="py-12 text-center text-muted-foreground">Select an event from the Events tab first</div>;

  const filtered = (guests ?? []).filter((g) => {
    if (checkedInFilter === "yes") return g.checkedIn;
    if (checkedInFilter === "no") return !g.checkedIn;
    return true;
  });

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Ticket", "Check-In Code", "Registered", "Checked In"];
    const rows = filtered.map((g) => [
      g.displayName ?? "N/A", g.email ?? "N/A", g.phone ?? "N/A", g.tierName ?? "General",
      g.checkInCode ?? "N/A", g.registeredAt ? new Date(g.registeredAt).toLocaleString() : "N/A", g.checkedIn ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `guest-list-${eventId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div><label className="text-xs font-medium text-muted-foreground block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-border rounded px-3 py-2 text-sm bg-background" /></div>
        <div><label className="text-xs font-medium text-muted-foreground block mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-border rounded px-3 py-2 text-sm bg-background" /></div>
        <div><label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
          <select value={checkedInFilter} onChange={(e) => setCheckedInFilter(e.target.value as any)} className="border border-border rounded px-3 py-2 text-sm bg-background">
            <option value="all">All</option><option value="yes">Checked In</option><option value="no">Not Checked In</option>
          </select></div>
        <Button variant="outline" onClick={exportCSV} className="ml-auto"><Download size={14} className="mr-2" /> Export CSV</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading guests...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No guests found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={`${g.userId}-${i}`} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">{g.displayName ?? "N/A"}</td>
                    <td className="px-4 py-3">{g.email ?? "N/A"}</td>
                    <td className="px-4 py-3">{g.phone ?? "N/A"}</td>
                    <td className="px-4 py-3">{g.tierName ?? "General"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{g.checkInCode ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs uppercase rounded ${g.checkedIn ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {g.checkedIn ? "Checked In" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { if (confirm("Remove this guest's ticket?")) removeGuest.mutate(g.userId); }} className="text-destructive hover:text-destructive/80">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};