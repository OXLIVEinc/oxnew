import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import { useHotelBookings } from "@/hooks/api/useHotelBookings";
import { useHotelRoomTypes } from "@/hooks/api/useHotelRoomTypes";
import type { BookingTab } from "@/lib/api/hotelTypes";
import { formatDate, formatNaira, statusLabel, STATUS_BADGE_VARIANT } from "@/lib/hotelFormat";

const TABS: { key: BookingTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "paid_awaiting_confirmation", label: "Paid – Awaiting Confirmation" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "declined", label: "Declined" },
  { key: "expired", label: "Expired" },
];

interface Props {
  onSelectBooking: (id: string) => void;
}

export const BookingsPanel: React.FC<Props> = ({ onSelectBooking }) => {
  const [tab, setTab] = useState<BookingTab>("pending");
  const [search, setSearch] = useState("");
  const [roomTypeId, setRoomTypeId] = useState<string>("all");
  const [page, setPage] = useState(1);
  

  const { data: roomTypes } = useHotelRoomTypes();

  const params = useMemo(
    () => ({
      tab,
      search: search || undefined,
      roomTypeId: roomTypeId === "all" ? undefined : roomTypeId,
      page,
      pageSize: 15,
    }),
    [tab, search, roomTypeId, page]
  );

  const { data, isLoading, isFetching } = useHotelBookings(params);

  const showSkeleton = isLoading || (isFetching && !data);

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as BookingTab);
          setPage(1);
        }}
      >
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="data-[state=active]:bg-muted text-xs sm:text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, guest name, or phone"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={roomTypeId}
          onValueChange={(v) => {
            setRoomTypeId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All room types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All room types</SelectItem>
            {roomTypes?.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Always visible columns */}
                <TableHead>Reference</TableHead>
                <TableHead>Guest</TableHead>
                
                {/* Hidden on small screens */}
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Room Type</TableHead>
                <TableHead className="hidden lg:table-cell">Guests</TableHead>
                <TableHead className="hidden lg:table-cell">Check-in</TableHead>
                <TableHead className="hidden lg:table-cell">Check-out</TableHead>
                <TableHead className="hidden xl:table-cell">Nights</TableHead>
                
                {/* Always visible */}
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                
                {/* Hidden on small screens */}
                <TableHead className="hidden xl:table-cell">Created</TableHead>
                
                {/* Always visible */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showSkeleton ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={12}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.bookings.length ? (
                data.bookings.map((b) => (
                  <TableRow 
                    key={b.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => onSelectBooking(b.id)}
                  >
                    {/* Always visible */}
                    <TableCell className="font-mono text-xs whitespace-nowrap">{b.reference}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium truncate max-w-[100px] sm:max-w-none">
                          {b.guestName || "—"}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          {b.guestPhone}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Hidden on small screens */}
                    <TableCell className="hidden sm:table-cell">{b.guestPhone}</TableCell>
                    <TableCell className="hidden md:table-cell">{b.roomTypeName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{b.guests}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(b.checkIn)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(b.checkOut)}</TableCell>
                    <TableCell className="hidden xl:table-cell">{b.nights}</TableCell>
                    
                    {/* Always visible */}
                    <TableCell className="whitespace-nowrap">{formatNaira(b.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[b.status] ?? "outline"}>
                        {statusLabel(b.status)}
                      </Badge>
                    </TableCell>
                    
                    {/* Hidden on small screens */}
                    <TableCell className="hidden xl:table-cell">{formatDate(b.createdAt)}</TableCell>
                    
                    {/* Always visible */}
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onSelectBooking(b.id); 
                        }}
                      >
                        <span className="hidden sm:inline">View</span>
                        <Eye className="h-4 w-4 sm:hidden" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                    No bookings in this tab
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages} · {data.total} bookings
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};