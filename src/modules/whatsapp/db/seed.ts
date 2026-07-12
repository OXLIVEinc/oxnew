import "dotenv/config";
import { db } from "./client";
import * as schema from "../../../../shared/schema";
import { eq } from "drizzle-orm";
import { generateEventCode } from "../lib/ids";
import { formatClockTime } from "../lib/datetime";


/** Days from now, at a given 24hr hour/minute, in UTC. */
function inDays(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

/** slug-ify a brand name into a stable, deterministic organizer email. */
function organizerEmail(brandName: string): string {
  const slug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}@organizers.ox.app`;
}


interface EventSeedInput {
  slug: string;
  name: string;
  description: string;
  /** Organizer brand name — resolved to a `profiles.id` via getOrCreateOrganizerProfile. */
  creator: string;
  daysFromNow: number;
  startHour: number;
  endHour?: number; // if omitted, single-day event with no explicit end time
  venue: string;
  address: string;
  lat: number;
  lng: number;
  isPaid: boolean;
  ageGroup?: string;
  genre?: string;
  tags?: string[];
  backgroundImageUrl: string;
  maxPerOrder?: number;
  tiers?: { name: string; description?: string; price: string; quantity: number }[];
}

async function upsertEvent(input: EventSeedInput) {
  const eventCode = generateEventCode(input.slug);
  const existing = await db.select().from(schema.events).where(eq(schema.events.title, input.name)).limit(1);
  if (existing.length > 0) {
    console.log(`[seed] event "${input.name}" already exists, skipping`);
    return;
  }

  const createdBy = "914591e6-ec8a-4227-b584-5fd5801db4fa"
  const startsAt = inDays(input.daysFromNow, input.startHour);
  const endsAt = input.endHour !== undefined ? inDays(input.daysFromNow, input.endHour) : null;

  const [event] = await db
    .insert(schema.events)
    .values({
      eventCode,
      title: input.name,
      description: input.description,
      createdBy,
      startsAt,
      endsAt,
      startTime: formatClockTime(startsAt),
      endTime: endsAt ? formatClockTime(endsAt) : null,
      backgroundImageUrl: input.backgroundImageUrl,
      address: input.address,
      locationLat: String(input.lat),
      locationLng: String(input.lng),
      isPaid: input.isPaid,
      ageGroup: input.ageGroup,
      genre: input.genre,
      tags: input.tags,
      maxPerOrder: input.maxPerOrder ?? 10,
      status: "active",
      approvalStatus: "approved",
    })
    .returning();

  if (input.tiers && input.tiers.length > 0) {
    await db.insert(schema.ticketTiers).values(
      input.tiers.map((t) => ({
        eventId: event.id,
        name: t.name,
        description: t.description,
        price: t.price,
        quantity: t.quantity,
        isUnlimited: false,
      }))
    );
  } else {
    // Every event needs at least one tier — General Admission (free if
    // isPaid is false) is created automatically when an organizer doesn't
    // define their own. Left unlimited so a missing tier setup never
    // blocks admission.
    await db.insert(schema.ticketTiers).values({
      eventId: event.id,
      name: "General Admission",
      price: input.isPaid ? "5000" : "0",
      isUnlimited: true,
    });
  }

  console.log(`[seed] created event "${input.name}" (${eventCode})`);
}

interface HotelSeedInput {
  name: string;
  state: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  whatsappNumber: string;
  rooms: { name: string; description?: string; pricePerNight: string; capacity: number; sortOrder: number }[];
}

async function upsertHotel(input: HotelSeedInput) {
  const existing = await db.select().from(schema.hotelPartners).where(eq(schema.hotelPartners.name, input.name)).limit(1);
  if (existing.length > 0) {
    console.log(`[seed] hotel "${input.name}" already exists, skipping`);
    return;
  }

  const [hotel] = await db
    .insert(schema.hotelPartners)
    .values({
      name: input.name,
      state: input.state,
      city: input.city,
      address: input.address,
      locationLat: String(input.lat),
      locationLng: String(input.lng),
      whatsappNumber: input.whatsappNumber,
      approvalStatus: "approved",
    })
    .returning();

  await db.insert(schema.hotelRoomTypes).values(
    input.rooms.map((r) => ({
      hotelId: hotel.id,
      name: r.name,
      description: r.description,
      pricePerNight: r.pricePerNight,
      capacity: r.capacity,
      sortOrder: r.sortOrder,
    }))
  );

  console.log(`[seed] created hotel "${input.name}"`);
}

// ---------------------------------------------------------------------------
// 20 events, spread across Lagos, Abuja, and Port Harcourt, all upcoming.
// ---------------------------------------------------------------------------

const EVENTS: EventSeedInput[] = [
  {
    slug: "afrobeats-night", name: "Afrobeats Night", creator: "OX Entertainment",
    description: "A night of nonstop Afrobeats with Lagos' hottest DJs and surprise guest performances.",
    daysFromNow: 14, startHour: 20, endHour: 26, venue: "Eko Hotel Convention Centre",
    address: "Plot 1415 Adetokunbo Ademola St, Victoria Island, Lagos", lat: 6.4281, lng: 3.4219,
    isPaid: true, ageGroup: "18+", genre: "Afrobeats", tags: ["music", "nightlife", "lagos"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-afrobeats-night/1200/630",
    tiers: [
      { name: "General Admission", price: "5000", quantity: 500 },
      { name: "VIP (2 seats)", price: "25000", quantity: 100 },
      { name: "VIP (4 seats)", price: "45000", quantity: 50 },
    ],
  },
  {
    slug: "comedy-jam-lagos", name: "Comedy Jam Lagos", creator: "Laff Factory",
    description: "Nigeria's top comedians take the stage for a night of nonstop laughs.",
    daysFromNow: 10, startHour: 19, endHour: 22, venue: "Terra Kulture",
    address: "1376 Tiamiyu Savage St, Victoria Island, Lagos", lat: 6.4304, lng: 3.4210,
    isPaid: true, ageGroup: "16+", genre: "Comedy", tags: ["comedy", "live show"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-comedy-jam/1200/630",
    tiers: [
      { name: "Regular", price: "3500", quantity: 300 },
      { name: "Front Row", price: "8000", quantity: 60 },
    ],
  },
  {
    slug: "lagos-tech-summit", name: "Lagos Tech Summit", creator: "OX Conferences",
    description: "Founders, investors, and engineers gather to talk about the future of African tech.",
    daysFromNow: 21, startHour: 9, endHour: 17, venue: "Landmark Event Centre",
    address: "Water Corporation Rd, Oniru, Lagos", lat: 6.4380, lng: 3.4680,
    isPaid: true, ageGroup: "18+", genre: "Conference", tags: ["tech", "networking", "startups"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-tech-summit/1200/630",
    tiers: [
      { name: "Standard Pass", price: "15000", quantity: 400 },
      { name: "VIP Pass", price: "50000", quantity: 80 },
    ],
  },
  {
    slug: "detty-december-pool-party", name: "Detty December Pool Party", creator: "Splash Events",
    description: "Daytime pool party with live DJs, food trucks, and an open bar.",
    daysFromNow: 45, startHour: 12, endHour: 20, venue: "Civic Centre Lagos",
    address: "Ozumba Mbadiwe Ave, Victoria Island, Lagos", lat: 6.4295, lng: 3.4189,
    isPaid: true, ageGroup: "18+", genre: "Party", tags: ["pool party", "detty december"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-pool-party/1200/630",
    tiers: [
      { name: "General Admission", price: "10000", quantity: 600 },
      { name: "Cabana (6 people)", price: "120000", quantity: 20 },
    ],
  },
  {
    slug: "abuja-jazz-evening", name: "Abuja Jazz Evening", creator: "Capital Sounds",
    description: "An intimate evening of live jazz featuring some of Nigeria's finest instrumentalists.",
    daysFromNow: 18, startHour: 19, endHour: 23, venue: "Transcorp Hilton Abuja",
    address: "1 Aguiyi Ironsi St, Maitama, Abuja", lat: 9.0875, lng: 7.4951,
    isPaid: true, ageGroup: "21+", genre: "Jazz", tags: ["jazz", "live music", "abuja"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-jazz-evening/1200/630",
    tiers: [
      { name: "Standard", price: "8000", quantity: 200 },
      { name: "Table for 4", price: "40000", quantity: 25 },
    ],
  },
  {
    slug: "port-harcourt-food-festival", name: "Port Harcourt Food Festival", creator: "Garden City Eats",
    description: "A celebration of Niger Delta cuisine with over 40 local vendors.",
    daysFromNow: 25, startHour: 11, endHour: 21, venue: "Isaac Boro Park",
    address: "Aba Rd, Port Harcourt, Rivers", lat: 4.8156, lng: 7.0498,
    isPaid: false, ageGroup: "All ages", genre: "Food & Culture", tags: ["food", "family friendly"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-food-festival/1200/630",
  },
  {
    slug: "gospel-night-lagos", name: "Gospel Night Lagos", creator: "Rock of Ages Ministries",
    description: "A worship concert bringing together some of Nigeria's leading gospel artists.",
    daysFromNow: 12, startHour: 18, endHour: 22, venue: "Teslim Balogun Stadium",
    address: "Stadium Rd, Surulere, Lagos", lat: 6.4959, lng: 3.3616,
    isPaid: false, ageGroup: "All ages", genre: "Gospel", tags: ["gospel", "worship"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-gospel-night/1200/630",
  },
  {
    slug: "lagos-fashion-week", name: "Lagos Fashion Week", creator: "Style House NG",
    description: "Runway shows from Nigeria's most exciting emerging and established designers.",
    daysFromNow: 33, startHour: 15, endHour: 21, venue: "The Federal Palace Hotel",
    address: "6/7 Ahmadu Bello Way, Victoria Island, Lagos", lat: 6.4235, lng: 3.4218,
    isPaid: true, ageGroup: "16+", genre: "Fashion", tags: ["fashion", "runway"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-fashion-week/1200/630",
    tiers: [
      { name: "General Admission", price: "12000", quantity: 350 },
      { name: "Front Row VIP", price: "60000", quantity: 40 },
    ],
  },
  {
    slug: "abuja-marathon-expo", name: "Abuja Marathon Expo", creator: "RunNG",
    description: "Race-kit pickup, sports gear vendors, and fitness talks ahead of the Abuja City Marathon.",
    daysFromNow: 9, startHour: 9, endHour: 18, venue: "Old Parade Ground",
    address: "Independence Ave, Abuja", lat: 9.0579, lng: 7.4951,
    isPaid: false, ageGroup: "All ages", genre: "Sports", tags: ["running", "fitness"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-marathon-expo/1200/630",
  },
  {
    slug: "amapiano-vs-afrobeats", name: "Amapiano vs Afrobeats", creator: "OX Entertainment",
    description: "Two of Africa's biggest sounds go back-to-back all night, DJ battle style.",
    daysFromNow: 28, startHour: 21, endHour: 27, venue: "Muri Okunola Park",
    address: "Muri Okunola St, Victoria Island, Lagos", lat: 6.4276, lng: 3.4227,
    isPaid: true, ageGroup: "18+", genre: "Amapiano", tags: ["amapiano", "afrobeats", "nightlife"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-amapiano-vs-afrobeats/1200/630",
    tiers: [
      { name: "General Admission", price: "7500", quantity: 500 },
      { name: "VIP", price: "30000", quantity: 100 },
    ],
  },
  {
    slug: "startup-pitch-night", name: "Startup Pitch Night", creator: "OX Ventures",
    description: "Ten early-stage founders pitch live to a panel of Nigerian VCs.",
    daysFromNow: 16, startHour: 17, endHour: 20, venue: "Wheatbaker Hotel",
    address: "4 Onitolo Rd, Ikoyi, Lagos", lat: 6.4441, lng: 3.4335,
    isPaid: false, ageGroup: "18+", genre: "Business", tags: ["startups", "pitching"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-pitch-night/1200/630",
  },
  {
    slug: "owambe-experience", name: "The Owambe Experience", creator: "Aso Ebi Collective",
    description: "A themed party celebrating Yoruba wedding culture — aso-ebi encouraged, live band included.",
    daysFromNow: 40, startHour: 16, endHour: 24, venue: "Balmoral Convention Centre",
    address: "Federal Palace Hotel Complex, Victoria Island, Lagos", lat: 6.4232, lng: 3.4215,
    isPaid: true, ageGroup: "18+", genre: "Culture", tags: ["owambe", "culture", "party"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-owambe/1200/630",
    tiers: [
      { name: "General Admission", price: "15000", quantity: 400 },
      { name: "Aso-Ebi Table (10 seats)", price: "180000", quantity: 15 },
    ],
  },
  {
    slug: "rivers-state-carnival", name: "Rivers State Carnival (CARNIRIV)", creator: "Rivers State Tourism Board",
    description: "Street parade, live bands, and cultural floats celebrating Rivers State heritage.",
    daysFromNow: 55, startHour: 10, endHour: 22, venue: "Port Harcourt City Stadium",
    address: "Stadium Rd, Port Harcourt, Rivers", lat: 4.8283, lng: 7.0134,
    isPaid: false, ageGroup: "All ages", genre: "Carnival", tags: ["carnival", "culture", "family friendly"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-carniriv/1200/630",
  },
  {
    slug: "afronation-warmup-party", name: "Afronation Warm-Up Party", creator: "OX Entertainment",
    description: "The official Lagos warm-up party ahead of Afronation, headlined by surprise acts.",
    daysFromNow: 60, startHour: 21, endHour: 28, venue: "Landmark Beach",
    address: "Water Corporation Rd, Oniru, Lagos", lat: 6.4340, lng: 3.4708,
    isPaid: true, ageGroup: "18+", genre: "Afrobeats", tags: ["afronation", "beach party"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-afronation-warmup/1200/630",
    tiers: [
      { name: "General Admission", price: "10000", quantity: 800 },
      { name: "VIP", price: "40000", quantity: 150 },
    ],
  },
  {
    slug: "abuja-book-fair", name: "Abuja International Book Fair", creator: "Nigerian Publishers Association",
    description: "Publishers, authors, and readers gather for book launches, signings, and panel talks.",
    daysFromNow: 30, startHour: 10, endHour: 18, venue: "International Conference Centre",
    address: "Herbert Macaulay Way, Central Business District, Abuja", lat: 9.0526, lng: 7.4913,
    isPaid: false, ageGroup: "All ages", genre: "Literature", tags: ["books", "culture"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-book-fair/1200/630",
  },
  {
    slug: "afrohouse-sunset-sessions", name: "AfroHouse Sunset Sessions", creator: "Sundown Collective",
    description: "A sunset-to-midnight AfroHouse set on the water, boats and all.",
    daysFromNow: 22, startHour: 16, endHour: 24, venue: "Ilashe Beach",
    address: "Ilashe, Lagos", lat: 6.4126, lng: 3.3762,
    isPaid: true, ageGroup: "18+", genre: "AfroHouse", tags: ["boat party", "sunset", "house music"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-sunset-sessions/1200/630",
    tiers: [
      { name: "General Admission", price: "20000", quantity: 250 },
      { name: "Boat Deck VIP", price: "65000", quantity: 40 },
    ],
  },
  {
    slug: "naija-stand-up-tour-abuja", name: "Naija Stand-Up Tour — Abuja", creator: "Laff Factory",
    description: "The Abuja stop of the nationwide stand-up comedy tour.",
    daysFromNow: 19, startHour: 19, endHour: 22, venue: "Congress Hall, Transcorp Hilton",
    address: "1 Aguiyi Ironsi St, Maitama, Abuja", lat: 9.0875, lng: 7.4951,
    isPaid: true, ageGroup: "16+", genre: "Comedy", tags: ["comedy", "abuja"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-standup-abuja/1200/630",
    tiers: [
      { name: "Regular", price: "5000", quantity: 300 },
      { name: "VIP", price: "15000", quantity: 60 },
    ],
  },
  {
    slug: "port-harcourt-boat-regatta", name: "Port Harcourt Boat Regatta", creator: "Garden City Water Sports",
    description: "Traditional boat racing on the New Calabar River, with live commentary and food stalls.",
    daysFromNow: 37, startHour: 9, endHour: 16, venue: "Isaac Boro Park Waterfront",
    address: "Aba Rd, Port Harcourt, Rivers", lat: 4.8140, lng: 7.0512,
    isPaid: false, ageGroup: "All ages", genre: "Sports", tags: ["regatta", "family friendly"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-boat-regatta/1200/630",
  },
  {
    slug: "lagos-anime-con", name: "Lagos Anime Con", creator: "OtakuNG",
    description: "Cosplay competitions, manga vendors, and anime screenings all day.",
    daysFromNow: 26, startHour: 10, endHour: 20, venue: "Balmoral Convention Centre",
    address: "Federal Palace Hotel Complex, Victoria Island, Lagos", lat: 6.4232, lng: 3.4215,
    isPaid: true, ageGroup: "All ages", genre: "Pop Culture", tags: ["anime", "cosplay", "gaming"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-anime-con/1200/630",
    tiers: [
      { name: "General Admission", price: "6000", quantity: 700 },
      { name: "Cosplay Contestant Pass", price: "10000", quantity: 100 },
    ],
  },
  {
    slug: "new-year-eve-countdown-lagos", name: "New Year's Eve Countdown Lagos", creator: "OX Entertainment",
    description: "Lagos' biggest countdown party with fireworks over the lagoon at midnight.",
    daysFromNow: 90, startHour: 20, endHour: 30, venue: "Landmark Beach",
    address: "Water Corporation Rd, Oniru, Lagos", lat: 6.4340, lng: 3.4708,
    isPaid: true, ageGroup: "18+", genre: "Party", tags: ["nye", "fireworks", "countdown"],
    backgroundImageUrl: "https://picsum.photos/seed/ox-nye-countdown/1200/630",
    tiers: [
      { name: "General Admission", price: "25000", quantity: 1000 },
      { name: "VIP", price: "80000", quantity: 200 },
      { name: "VVIP Table (8 seats)", price: "500000", quantity: 20 },
    ],
  },
];

// ---------------------------------------------------------------------------
// 20 hotel partners across Lagos, Abuja, and Port Harcourt.
// ---------------------------------------------------------------------------

const HOTELS: HotelSeedInput[] = [
  { name: "Eko Hotel & Suites", state: "Lagos", city: "Lagos", address: "Plot 1415 Adetokunbo Ademola St, Victoria Island, Lagos", lat: 6.4285, lng: 3.4225, whatsappNumber: "2348021110001",
    rooms: [
      { name: "Standard Room", pricePerNight: "85000", capacity: 2, sortOrder: 0 },
      { name: "Executive Room", pricePerNight: "120000", capacity: 2, sortOrder: 1 },
      { name: "Suite", pricePerNight: "220000", capacity: 4, sortOrder: 2 },
    ] },
  { name: "Radisson Blu Anchorage", state: "Lagos", city: "Lagos", address: "1A Ozumba Mbadiwe Ave, Victoria Island, Lagos", lat: 6.4300, lng: 3.4230, whatsappNumber: "2348021110002",
    rooms: [
      { name: "Standard Room", pricePerNight: "72000", capacity: 2, sortOrder: 0 },
      { name: "Deluxe Room", pricePerNight: "95000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Federal Palace Hotel", state: "Lagos", city: "Lagos", address: "6/7 Ahmadu Bello Way, Victoria Island, Lagos", lat: 6.4235, lng: 3.4218, whatsappNumber: "2348021110003",
    rooms: [
      { name: "Classic Room", pricePerNight: "65000", capacity: 2, sortOrder: 0 },
      { name: "Premier Room", pricePerNight: "98000", capacity: 2, sortOrder: 1 },
      { name: "Executive Suite", pricePerNight: "175000", capacity: 3, sortOrder: 2 },
    ] },
  { name: "Wheatbaker Hotel", state: "Lagos", city: "Lagos", address: "4 Onitolo Rd, Ikoyi, Lagos", lat: 6.4441, lng: 3.4335, whatsappNumber: "2348021110004",
    rooms: [
      { name: "Deluxe Room", pricePerNight: "110000", capacity: 2, sortOrder: 0 },
      { name: "Suite", pricePerNight: "190000", capacity: 3, sortOrder: 1 },
    ] },
  { name: "Lagos Continental Hotel", state: "Lagos", city: "Lagos", address: "52A Kofo Abayomi St, Victoria Island, Lagos", lat: 6.4262, lng: 3.4197, whatsappNumber: "2348021110005",
    rooms: [
      { name: "Standard Room", pricePerNight: "68000", capacity: 2, sortOrder: 0 },
      { name: "Club Room", pricePerNight: "99000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Bogobiri House", state: "Lagos", city: "Lagos", address: "9 Maitama Sule St, Ikoyi, Lagos", lat: 6.4474, lng: 3.4270, whatsappNumber: "2348021110006",
    rooms: [
      { name: "Artist Room", pricePerNight: "45000", capacity: 2, sortOrder: 0 },
      { name: "Garden Suite", pricePerNight: "75000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Southern Sun Ikoyi", state: "Lagos", city: "Lagos", address: "Bank PHB Plaza, Alfred Rewane Rd, Ikoyi, Lagos", lat: 6.4494, lng: 3.4276, whatsappNumber: "2348021110007",
    rooms: [
      { name: "Standard Room", pricePerNight: "78000", capacity: 2, sortOrder: 0 },
      { name: "Executive Room", pricePerNight: "115000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Sheraton Lagos Hotel", state: "Lagos", city: "Lagos", address: "30 Mobolaji Bank Anthony Way, Ikeja, Lagos", lat: 6.5966, lng: 3.3515, whatsappNumber: "2348021110008",
    rooms: [
      { name: "Deluxe Room", pricePerNight: "82000", capacity: 2, sortOrder: 0 },
      { name: "Club Room", pricePerNight: "125000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Lakowe Lakes Golf & Resort", state: "Lagos", city: "Lagos", address: "Lekki-Epe Expressway, Lakowe, Lagos", lat: 6.4700, lng: 3.6420, whatsappNumber: "2348021110009",
    rooms: [
      { name: "Golf View Room", pricePerNight: "60000", capacity: 2, sortOrder: 0 },
      { name: "Villa", pricePerNight: "150000", capacity: 6, sortOrder: 1 },
    ] },
  { name: "Oriental Hotel Lagos", state: "Lagos", city: "Lagos", address: "3 Lekki Rd, Victoria Island, Lagos", lat: 6.4265, lng: 3.4443, whatsappNumber: "2348021110010",
    rooms: [
      { name: "Standard Room", pricePerNight: "70000", capacity: 2, sortOrder: 0 },
      { name: "Ocean View Suite", pricePerNight: "160000", capacity: 3, sortOrder: 1 },
    ] },
  { name: "Transcorp Hilton Abuja", state: "FCT", city: "Abuja", address: "1 Aguiyi Ironsi St, Maitama, Abuja", lat: 9.0875, lng: 7.4951, whatsappNumber: "2348021110011",
    rooms: [
      { name: "Standard Room", pricePerNight: "95000", capacity: 2, sortOrder: 0 },
      { name: "Executive Suite", pricePerNight: "180000", capacity: 3, sortOrder: 1 },
    ] },
  { name: "Sheraton Abuja Hotel", state: "FCT", city: "Abuja", address: "Ladi Kwali Way, Central Business District, Abuja", lat: 9.0498, lng: 7.4890, whatsappNumber: "2348021110012",
    rooms: [
      { name: "Deluxe Room", pricePerNight: "88000", capacity: 2, sortOrder: 0 },
      { name: "Club Room", pricePerNight: "130000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Nicon Luxury Hotel", state: "FCT", city: "Abuja", address: "Shehu Shagari Way, Central Business District, Abuja", lat: 9.0431, lng: 7.4934, whatsappNumber: "2348021110013",
    rooms: [
      { name: "Standard Room", pricePerNight: "60000", capacity: 2, sortOrder: 0 },
      { name: "Executive Suite", pricePerNight: "115000", capacity: 3, sortOrder: 1 },
    ] },
  { name: "Reiz Continental Hotel", state: "FCT", city: "Abuja", address: "Plot 779, Central Business District, Abuja", lat: 9.0453, lng: 7.4956, whatsappNumber: "2348021110014",
    rooms: [
      { name: "Standard Room", pricePerNight: "55000", capacity: 2, sortOrder: 0 },
      { name: "Suite", pricePerNight: "105000", capacity: 3, sortOrder: 1 },
    ]
   },

  { name: "Fraser Suites Abuja", state: "FCT", city: "Abuja", address: "6 Yakubu Gowon Crescent, Asokoro, Abuja", lat: 9.0333, lng: 7.5205, whatsappNumber: "2348021110015",
    rooms: [
      { name: "Studio Apartment", pricePerNight: "72000", capacity: 2, sortOrder: 0 },
      { name: "One-Bedroom Suite", pricePerNight: "110000", capacity: 3, sortOrder: 1 },
    ] },

  { name: "Golden Tulip Port Harcourt", state: "Rivers", city: "Port Harcourt", address: "1 Josiah Ojo Rd, GRA Phase 2, Port Harcourt", lat: 4.8180, lng: 7.0330, whatsappNumber: "2348021110016",
    rooms: [
      { name: "Standard Room", pricePerNight: "58000", capacity: 2, sortOrder: 0 },
      { name: "Executive Room", pricePerNight: "90000", capacity: 2, sortOrder: 1 },
    ] },

  { name: "Presidential Hotel Port Harcourt", state: "Rivers", city: "Port Harcourt", address: "Aba Rd, GRA, Port Harcourt", lat: 4.8114, lng: 7.0400, whatsappNumber: "2348021110017",
    rooms: [
      { name: "Standard Room", pricePerNight: "50000", capacity: 2, sortOrder: 0 },
      { name: "Suite", pricePerNight: "95000", capacity: 3, sortOrder: 1 },
    ] },
  { name: "Novotel Port Harcourt", state: "Rivers", city: "Port Harcourt", address: "6 Woji Rd, GRA Phase 2, Port Harcourt", lat: 4.8221, lng: 7.0367, whatsappNumber: "2348021110018",
    rooms: [
      { name: "Standard Room", pricePerNight: "62000", capacity: 2, sortOrder: 0 },
      { name: "Executive Room", pricePerNight: "98000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "BON Hotel Port Harcourt", state: "Rivers", city: "Port Harcourt", address: "1 Olu Obasanjo Rd, Port Harcourt", lat: 4.8079, lng: 7.0189, whatsappNumber: "2348021110019",
    rooms: [
      { name: "Standard Room", pricePerNight: "48000", capacity: 2, sortOrder: 0 },
      { name: "Deluxe Room", pricePerNight: "75000", capacity: 2, sortOrder: 1 },
    ] },
  { name: "Meridien Hotel Port Harcourt", state: "Rivers", city: "Port Harcourt", address: "Olu Obasanjo Rd, Port Harcourt", lat: 4.8064, lng: 7.0201, whatsappNumber: "2348021110020",
    rooms: [
      { name: "Standard Room", pricePerNight: "45000", capacity: 2, sortOrder: 0 },
      { name: "Suite", pricePerNight: "80000", capacity: 3, sortOrder: 1 },
    ] },
];

async function main() {
  for (const event of EVENTS) {
    await upsertEvent(event);
  }
  for (const hotel of HOTELS) {
    await upsertHotel(hotel);
  }
  console.log(`[seed] done — ${EVENTS.length} events, ${HOTELS.length} hotels`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
