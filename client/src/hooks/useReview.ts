import {
  useEffect,
  useState,
} from "react";

import {
  getEvent,
  getOrder,
  getSession,
  getTicketTier,
  updateSession,
} from "../services/reviewApi";

import type {
  Order,
  ReviewState,
  Session,
  TicketTier,
} from "../types";
import { type Event } from "../types";

export const useReview = (sessionId: string): ReviewState & { reload: () => Promise<void> } => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [session, setSession] = useState<Session | undefined>();
  const [order, setOrder] = useState<Order | undefined>();
  const [event, setEvent] = useState<Event | undefined>();
  const [tier, setTier] = useState<TicketTier | undefined>();
  const [quantity, setQuantity] = useState(0);
  const [mode, setMode] = useState<"cart" | "order">("cart");
  const [shouldResumeCheckout, setShouldResumeCheckout] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | undefined>();

  const load = async () => {
    try {
      setLoading(true);
      setError(undefined);
      console.log('hhshs')
      const sessionData = await getSession(sessionId);
      setSession(sessionData);

      // Resume existing order if possible
      if (sessionData.context.orderId) {
        const orderData = await getOrder(sessionData.context.orderId);

        const isResumable =
          orderData.status === "awaiting_payment" &&
          new Date(orderData.expiresAt) > new Date();

        if (isResumable) {
          setMode("order");
          setOrder(orderData);
          setShouldResumeCheckout(true);
          setCheckoutUrl(sessionData.context.checkoutUrl);
          setQuantity(orderData.items.length);

          if (sessionData.context.eventId) {
            const eventData = await getEvent(sessionData.context.eventId);
            setEvent(eventData);
          }
          return;
        }

        // Order expired → clean up session
        await updateSession(sessionData.id, {
          status: "selected_quantity",
          context: {
            ...sessionData.context,
            orderId: undefined,
            checkoutUrl: undefined,
          },
        });
      }

      // Cart flow
      if (!sessionData.context.eventId) {
        throw new Error("No event selected.");
      }

      if (!sessionData.context.ticketTierId) {
        throw new Error("No ticket tier selected.");
      }

      const [eventData, tierData] = await Promise.all([
        getEvent(sessionData.context.eventId),
        getTicketTier(sessionData.context.ticketTierId),
      ]);

      setEvent(eventData);
      setTier(tierData);
      setQuantity(sessionData.context.quantity ?? 0);
      setMode("cart");
    } catch (err: any) {
      setError(err.message ?? "Unable to load review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    loading,
    error,
    mode,
    session,
    order,
    event,
    tier,
    quantity,
    checkoutUrl,
    shouldResumeCheckout,
    reload: load,
  };
};