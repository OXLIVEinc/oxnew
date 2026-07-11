/**
 * src/components/hotel/PayoutsPanel.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHotelPayouts } from "@/hooks/api/useHotelPayouts";
import { formatDate, formatNaira } from "@/lib/hotelFormat";

export const PayoutsPanel: React.FC = () => {
  const { data, isLoading } = useHotelPayouts();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Gross Earnings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNaira(data.grossEarnings)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Platform Commission ({data.commissionRate}%)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-muted-foreground">{formatNaira(data.platformCommission)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Net Earnings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNaira(data.netEarnings)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Payout</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{formatNaira(data.pendingPayout)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.length > 0 ? (
                data.history.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell>{formatNaira(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" || p.status === "completed" ? "default" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.paystackTransferRef || "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No payouts have been made yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
