import { BotReply, ConversationContext } from "../../types";
import { getSession, setState } from "../session";
import { HotelPartnerRow } from "../../data/db";
import { findHotelOrderByReference, confirmHotelOrder, findPendingHotelOrders } from "../../data/db";
import { buildHotelMenu, buildBookingSummary } from "../helpers";
import * as db from '../../data/db';
import * as hotelFlow from '../flows/hotelFlow';

export async function handleMessage(
    phone: string,
    text: string,
    hotel: HotelPartnerRow,
    waName: string
): Promise<BotReply> {
    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();

    const session = await getSession(phone);

    switch (session.state) {
        case "HOTEL_CONFIRM_ACTION":
            return handleConfirmation(phone, upper, session.context, hotel, waName);

        default:
            return handleHome(phone, upper, hotel, waName);
    }
}

async function handleHome(
    phone: string,
    text: string,
    hotel: HotelPartnerRow,
    waName?: string
): Promise<BotReply> {
    const menu = buildHotelMenu(hotel, waName);

    if (text === "HI" || text === "HELLO" || text === "MENU") {
        await setState(phone, "HOTEL_HOME", {});
        return {
            reply: menu,
        };
    }

    if (text === "1") {
        return showPendingBookings(phone, hotel.id);
    }

    if (text.startsWith("CONFIRM ")) {
        return startBookingAction(phone, hotel.id, text, "CONFIRM");
    }

    if (text.startsWith("DECLINE ")) {
        return startBookingAction(phone, hotel.id, text, "DECLINE");
    }

    if (text.startsWith("VIEW ")) {
        return viewBooking(hotel.id, text);
    }

    return {
        reply: menu,
    };
}

async function showPendingBookings(
    phone: string,
    hotelId: string
): Promise<BotReply> {
    const bookings = await findPendingHotelOrders(hotelId);

    if (!bookings.length) {
        return {
            reply: "There are no bookings awaiting your confirmation.",
        };
    }

    const lines = bookings.map((booking, index) => {
        return `${index + 1}.
Reference: ${booking.reference}
Guest: ${booking.guestName}
Check-in: ${booking.checkIn}

Reply:
CONFIRM ${booking.reference}

or

DECLINE ${booking.reference}`;
    });

    return {
        reply: lines.join("\n\n"),
    };
}

async function startBookingAction(
    phone: string,
    hotelId: string,
    command: string,
    action: "CONFIRM" | "DECLINE"
): Promise<BotReply> {
    const [, reference] = command.split(/\s+/);

    const order = await findHotelOrderByReference(reference);

    if (!order || order.hotelId !== hotelId) {
        return {
            reply: `Booking ${reference} was not found.`,
        };
    }

    if (order.status !== "paid") {
        return {
            reply: `Booking ${reference} has already been processed.`,
        };
    }

    await setState(phone, "HOTEL_CONFIRM_ACTION", {
        hotelAction: {
            action,
            reference,
        },
    });

    return {
        reply: `You're about to ${action.toLowerCase()} booking ${reference}.

Reply YES to continue or NO to cancel.`,
    };
}

async function handleConfirmation(
    phone: string,
    text: string,
    context: ConversationContext,
    hotel: HotelPartnerRow,
    waName: string,
): Promise<BotReply> {
    if (!context.hotelAction) {
        const menu = buildHotelMenu(hotel, waName);
        await setState(phone, "HOTEL_HOME", {});
        return {
            reply: menu,
        };
    }

    if (text === "NO") {
        await setState(phone, "HOTEL_HOME", {});
        return {
            reply: "Action cancelled.",
        };
    }

    if (text !== "YES") {
        return {
            reply: "Reply YES or NO.",
        };
    }

    const { action, reference } = context.hotelAction;

    const order = await findHotelOrderByReference(reference);

    if (!order) {
        await setState(phone, "HOTEL_HOME", {});
        return {
            reply: "Booking not found.",
        };
    }

    if (action === "CONFIRM") {
        const updated = await confirmHotelOrder(order.id);

        // Notify the guest that the hotel has accepted the booking
        await hotelFlow.notifyGuestOfHotelConfirmation(updated);

        await setState(phone, "HOTEL_HOME", {});

        return {
            reply: `Booking ${reference} confirmed successfully.`,
        };
    }


    const updated = await db.declineHotelOrderAndQueueRefund(
        order.id,
        "Hotel declined booking.",
    );

    await hotelFlow.notifyGuestOfDecline(updated);

    await setState(phone, "HOTEL_HOME", {});

    return {
        reply: `Booking ${reference} declined.`,
    };
}


async function viewBooking(
    hotelId: string,
    command: string
): Promise<BotReply> {
    const [, reference] = command.split(/\s+/);

    const order = await findHotelOrderByReference(reference.toUpperCase());

    if (!order || order.hotelId !== hotelId) {
        return {
            reply: `Booking ${reference} was not found.`,
        };
    }

    return {
        reply: buildBookingSummary(order),
    };
}