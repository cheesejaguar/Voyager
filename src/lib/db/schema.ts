import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  real,
  date,
  time,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums ---

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);

export const tripStatusEnum = pgEnum("trip_status", [
  "planning",
  "active",
  "completed",
  "archived",
]);

export const tripMemberRoleEnum = pgEnum("trip_member_role", [
  "owner",
  "member",
]);

export const importSourceTypeEnum = pgEnum("import_source_type", [
  "flight",
  "hotel",
  "activity",
  "unknown",
]);

export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "reviewed",
  "confirmed",
  "rejected",
]);

export const flightDirectionEnum = pgEnum("flight_direction", [
  "outbound",
  "return",
]);

export const itineraryItemTypeEnum = pgEnum("itinerary_item_type", [
  "activity",
  "meal",
  "transit",
  "free_time",
  "custom",
]);

export const itinerarySourceEnum = pgEnum("itinerary_source", [
  "manual",
  "recommendation",
  "import",
]);

export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "suggested",
  "saved",
  "added",
  "dismissed",
]);

export const tripSummaryStyleEnum = pgEnum("trip_summary_style", [
  "concise",
  "narrative",
  "scrapbook",
]);

// --- Tables ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: subscriptionTierEnum("plan"),
  status: subscriptionStatusEnum("status"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  destinations: text("destinations").array(),
  status: tripStatusEnum("status").default("planning"),
  preferenceOverrides: jsonb("preference_overrides"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tripMembers = pgTable("trip_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: tripMemberRoleEnum("role").default("member"),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at"),
});

export const importDocuments = pgTable("import_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  rawText: text("raw_text"),
  sourceType: importSourceTypeEnum("source_type"),
  parsedJson: jsonb("parsed_json"),
  confidence: real("confidence"),
  status: importStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const flightSegments = pgTable("flight_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  importDocumentId: uuid("import_document_id").references(
    () => importDocuments.id,
  ),
  airline: text("airline"),
  flightNumber: text("flight_number"),
  confirmationCode: text("confirmation_code"),
  passengerNames: text("passenger_names").array(),
  departureAirport: text("departure_airport"),
  arrivalAirport: text("arrival_airport"),
  departureTime: timestamp("departure_time", { withTimezone: true }),
  arrivalTime: timestamp("arrival_time", { withTimezone: true }),
  terminal: text("terminal"),
  gate: text("gate"),
  cabinClass: text("cabin_class"),
  seat: text("seat"),
  connectionGroup: text("connection_group"),
  direction: flightDirectionEnum("direction"),
  status: text("status").default("scheduled"),
  sortOrder: integer("sort_order").default(0),
});

export const hotelStays = pgTable("hotel_stays", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  importDocumentId: uuid("import_document_id").references(
    () => importDocuments.id,
  ),
  hotelName: text("hotel_name"),
  address: text("address"),
  confirmationNumber: text("confirmation_number"),
  checkIn: timestamp("check_in", { withTimezone: true }),
  checkOut: timestamp("check_out", { withTimezone: true }),
  roomType: text("room_type"),
  guestCount: integer("guest_count"),
  contactInfo: text("contact_info"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

export const itineraryItems = pgTable("itinerary_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  date: date("date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  type: itineraryItemTypeEnum("type"),
  title: text("title").notNull(),
  description: text("description"),
  locationName: text("location_name"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  category: text("category"),
  source: itinerarySourceEnum("source").default("manual"),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  transitDurationMin: integer("transit_duration_min"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  targetDate: date("target_date"),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  rationale: text("rationale"),
  estimatedDurationMin: integer("estimated_duration_min"),
  distanceFromAnchor: text("distance_from_anchor"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  rating: real("rating"),
  priceLevel: integer("price_level"),
  foursquareId: text("foursquare_id"),
  photoUrl: text("photo_url"),
  status: recommendationStatusEnum("status").default("suggested"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const packingItems = pgTable("packing_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  category: text("category"),
  checked: boolean("checked").default(false),
  sortOrder: integer("sort_order").default(0),
});

export const preTripTasks = pgTable("pre_trip_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").default(false),
  dueDescription: text("due_description"),
  sortOrder: integer("sort_order").default(0),
});

export const photoAssets = pgTable("photo_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  filename: text("filename"),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  gpsLatitude: real("gps_latitude"),
  gpsLongitude: real("gps_longitude"),
  associatedDate: date("associated_date"),
  associatedItineraryItemId: uuid("associated_itinerary_item_id").references(
    () => itineraryItems.id,
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tripSummaries = pgTable("trip_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  style: tripSummaryStyleEnum("style"),
  content: text("content"),
  isPublic: boolean("is_public").default(false),
  publicSlug: text("public_slug"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Relations ---

export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  tripMembers: many(tripMembers),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(tripMembers),
  importDocuments: many(importDocuments),
  flightSegments: many(flightSegments),
  hotelStays: many(hotelStays),
  itineraryItems: many(itineraryItems),
  recommendations: many(recommendations),
  packingItems: many(packingItems),
  preTripTasks: many(preTripTasks),
  photoAssets: many(photoAssets),
  summaries: many(tripSummaries),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMembers.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripMembers.userId],
    references: [users.id],
  }),
}));

export const importDocumentsRelations = relations(
  importDocuments,
  ({ one, many }) => ({
    trip: one(trips, {
      fields: [importDocuments.tripId],
      references: [trips.id],
    }),
    flightSegments: many(flightSegments),
    hotelStays: many(hotelStays),
  }),
);

export const flightSegmentsRelations = relations(
  flightSegments,
  ({ one }) => ({
    trip: one(trips, {
      fields: [flightSegments.tripId],
      references: [trips.id],
    }),
    importDocument: one(importDocuments, {
      fields: [flightSegments.importDocumentId],
      references: [importDocuments.id],
    }),
  }),
);

export const hotelStaysRelations = relations(hotelStays, ({ one }) => ({
  trip: one(trips, {
    fields: [hotelStays.tripId],
    references: [trips.id],
  }),
  importDocument: one(importDocuments, {
    fields: [hotelStays.importDocumentId],
    references: [importDocuments.id],
  }),
}));

export const itineraryItemsRelations = relations(
  itineraryItems,
  ({ one, many }) => ({
    trip: one(trips, {
      fields: [itineraryItems.tripId],
      references: [trips.id],
    }),
    photoAssets: many(photoAssets),
  }),
);

export const recommendationsRelations = relations(
  recommendations,
  ({ one }) => ({
    trip: one(trips, {
      fields: [recommendations.tripId],
      references: [trips.id],
    }),
  }),
);

export const packingItemsRelations = relations(packingItems, ({ one }) => ({
  trip: one(trips, {
    fields: [packingItems.tripId],
    references: [trips.id],
  }),
}));

export const preTripTasksRelations = relations(preTripTasks, ({ one }) => ({
  trip: one(trips, {
    fields: [preTripTasks.tripId],
    references: [trips.id],
  }),
}));

export const photoAssetsRelations = relations(photoAssets, ({ one }) => ({
  trip: one(trips, {
    fields: [photoAssets.tripId],
    references: [trips.id],
  }),
  itineraryItem: one(itineraryItems, {
    fields: [photoAssets.associatedItineraryItemId],
    references: [itineraryItems.id],
  }),
}));

export const tripSummariesRelations = relations(tripSummaries, ({ one }) => ({
  trip: one(trips, {
    fields: [tripSummaries.tripId],
    references: [trips.id],
  }),
}));
