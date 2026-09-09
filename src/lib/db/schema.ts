import { pgTable, text, timestamp, uuid, real, boolean, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('collector'), // admin, collector, viewer
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Areas
export const areas = pgTable('areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameBn: varchar('name_bn', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Buildings
export const buildings = pgTable('buildings', {
  id: uuid('id').defaultRandom().primaryKey(),
  areaId: uuid('area_id').references(() => areas.id),
  sequenceOrder: real('sequence_order').notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameBn: varchar('name_bn', { length: 255 }).notNull(),
  address: text('address'),
  sideSection: varchar('side_section', { length: 255 }),
  floorCount: integer('floor_count').default(0),
  flatCount: integer('flat_count').default(0),
  contactInfo: text('contact_info'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const buildingsRelations = relations(buildings, ({ many, one }) => ({
  floors: many(floors),
  area: one(areas, {
    fields: [buildings.areaId],
    references: [areas.id],
  }),
}));

// Floors
export const floors = pgTable('floors', {
  id: uuid('id').defaultRandom().primaryKey(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  sequenceOrder: real('sequence_order').notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameBn: varchar('name_bn', { length: 255 }).notNull(),
});

export const floorsRelations = relations(floors, ({ many, one }) => ({
  building: one(buildings, {
    fields: [floors.buildingId],
    references: [buildings.id],
  }),
  flats: many(flats),
}));

// Flats
export const flats = pgTable('flats', {
  id: uuid('id').defaultRandom().primaryKey(),
  floorId: uuid('floor_id').notNull().references(() => floors.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  sequenceOrder: real('sequence_order').notNull(),
  notes: text('notes'),
});

export const flatsRelations = relations(flats, ({ one, many }) => ({
  floor: one(floors, {
    fields: [flats.floorId],
    references: [floors.id],
  }),
  families: many(flatFamilies),
}));

// Families (Master Data)
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  headName: varchar('head_name', { length: 255 }).notNull(),
  mobile: varchar('mobile', { length: 50 }),
  membersCount: integer('members_count').default(1),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Flat <-> Family mapping
export const flatFamilies = pgTable('flat_families', {
  id: uuid('id').defaultRandom().primaryKey(),
  flatId: uuid('flat_id').notNull().references(() => flats.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  isOwner: boolean('is_owner').default(false).notNull(),
  sideLocation: varchar('side_location', { length: 100 }), // North, South, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flatFamiliesRelations = relations(flatFamilies, ({ one }) => ({
  flat: one(flats, {
    fields: [flatFamilies.flatId],
    references: [flats.id],
  }),
  family: one(families, {
    fields: [flatFamilies.familyId],
    references: [families.id],
  }),
}));

// Projects
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameBn: varchar('name_bn', { length: 255 }).notNull(),
  year: integer('year').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, active, collection_completed, distribution_completed, closed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Project Families Snapshot
export const projectFamilies = pgTable('project_families', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id').notNull().references(() => families.id),
  flatId: uuid('flat_id').notNull().references(() => flats.id),
  headNameSnapshot: varchar('head_name_snapshot', { length: 255 }).notNull(),
  isOwnerSnapshot: boolean('is_owner_snapshot').default(false).notNull(),
  sideLocationSnapshot: varchar('side_location_snapshot', { length: 100 }),
});

export const projectFamiliesRelations = relations(projectFamilies, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectFamilies.projectId],
    references: [projects.id],
  }),
  family: one(families, {
    fields: [projectFamilies.familyId],
    references: [families.id],
  }),
  flat: one(flats, {
    fields: [projectFamilies.flatId],
    references: [flats.id],
  }),
  collections: many(collections),
  tobrukDistributions: many(tobrukDistributions),
}));

// Collections
export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectFamilyId: uuid('project_family_id').notNull().references(() => projectFamilies.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // paid, pending, refused
  date: timestamp('date').defaultNow().notNull(),
  collectedById: uuid('collected_by_id').notNull().references(() => users.id),
  // Optional explicit tobruk package breakdown: [{amount: 500, qty: 2}, {amount: 200, qty: 1}]
  // If null, Tobruk page shows the total amount for manual calculation
  tobrukPackageBreakdown: text('tobruk_package_breakdown'), // stored as JSON string
});

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  projectFamily: one(projectFamilies, {
    fields: [collections.projectFamilyId],
    references: [projectFamilies.id],
  }),
  collectedBy: one(users, {
    fields: [collections.collectedById],
    references: [users.id],
  }),
  receipts: many(receipts),
}));

// Receipts
export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  receiptNumber: varchar('receipt_number', { length: 100 }).notNull().unique(),
  date: timestamp('date').defaultNow().notNull(),
});

export const receiptsRelations = relations(receipts, ({ one }) => ({
  collection: one(collections, {
    fields: [receipts.collectionId],
    references: [collections.id],
  }),
}));

// Tobruk Distributions
export const tobrukDistributions = pgTable('tobruk_distributions', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectFamilyId: uuid('project_family_id').notNull().references(() => projectFamilies.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // distributed, pending
  quantity: integer('quantity').default(1),
  date: timestamp('date'),
  distributedById: uuid('distributed_by_id').references(() => users.id),
});

export const tobrukDistributionsRelations = relations(tobrukDistributions, ({ one }) => ({
  projectFamily: one(projectFamilies, {
    fields: [tobrukDistributions.projectFamilyId],
    references: [projectFamilies.id],
  }),
  distributedBy: one(users, {
    fields: [tobrukDistributions.distributedById],
    references: [users.id],
  }),
}));
