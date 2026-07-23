import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useOrganizerEvents,
  useEventAnalytics,
} from "@/hooks/api/useOrganizer";
import { formatNaira } from "@/lib/hotelFormat";

interface Props {
  eventId: string | null;
}

export const AnalyticsPanel: React.FC<Props> = ({
  eventId: propEventId,
}) => {
  const { data: events } = useOrganizerEvents();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    propEventId
  );

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setSelectedEventId(propEventId);
  }, [propEventId]);

  const { data, isLoading } = useEventAnalytics(selectedEventId, {
    dateFrom,
    dateTo,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Event
          </label>

          <Select
            value={selectedEventId ?? ""}
            onValueChange={(value) =>
              setSelectedEventId(value || null)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>

            <SelectContent className="max-h-60">
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            From
          </label>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-border rounded px-3 py-2.5 text-sm bg-background"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            To
          </label>

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-border rounded px-3 py-2.5 text-sm bg-background"
          />
        </div>
      </div>

      {!selectedEventId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select an event to view analytics
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Total Guests",
                value: data.totalGuests,
              },
              {
                label: "Checked In",
                value: data.checkedIn,
              },
              {
                label: "Attendance Rate",
                value: `${
                  data.totalGuests > 0
                    ? Math.round(
                        (data.checkedIn / data.totalGuests) * 100
                      )
                    : 0
                }%`,
              },
              {
                label: "Revenue",
                value: formatNaira(data.revenue),
              },
              {
                label: "Locations",
                value: Object.keys(data.locationCounts).length,
              },
            ].map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-xl font-semibold">
                  {card.value}
                </CardContent>
              </Card>
            ))}
          </div>

          {data.tierBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ticket Tier Breakdown
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {data.tierBreakdown.map((tier, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
                  >
                    <span>{tier.name}</span>

                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {tier.sold} sold
                      </span>

                      <span className="font-medium">
                        {formatNaira(tier.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Gender Distribution
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {Object.entries(data.genderCounts).map(
                  ([gender, count]) => (
                    <div
                      key={gender}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span>{gender}</span>

                      <span className="font-medium">{count}</span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Location Distribution
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {Object.entries(data.locationCounts).map(
                  ([location, count]) => (
                    <div
                      key={location}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span>{location}</span>

                      <span className="font-medium">{count}</span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};