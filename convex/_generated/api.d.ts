/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_verifySupabaseJwt from "../actions/verifySupabaseJwt.js";
import type * as mutations_authors from "../mutations/authors.js";
import type * as mutations_books from "../mutations/books.js";
import type * as mutations_fixImageEntityIds from "../mutations/fixImageEntityIds.js";
import type * as queries_activities from "../queries/activities.js";
import type * as queries_authorList from "../queries/authorList.js";
import type * as queries_authors from "../queries/authors.js";
import type * as queries_bookAuthors from "../queries/bookAuthors.js";
import type * as queries_bookImages from "../queries/bookImages.js";
import type * as queries_bookList from "../queries/bookList.js";
import type * as queries_books from "../queries/books.js";
import type * as queries_debug from "../queries/debug.js";
import type * as queries_discussions from "../queries/discussions.js";
import type * as queries_entityImages from "../queries/entityImages.js";
import type * as queries_events from "../queries/events.js";
import type * as queries_follows from "../queries/follows.js";
import type * as queries_friends from "../queries/friends.js";
import type * as queries_groups from "../queries/groups.js";
import type * as queries_photos from "../queries/photos.js";
import type * as queries_publisherList from "../queries/publisherList.js";
import type * as queries_publishers from "../queries/publishers.js";
import type * as queries_readingProgress from "../queries/readingProgress.js";
import type * as queries_reviews from "../queries/reviews.js";
import type * as queries_users from "../queries/users.js";
import type * as queries_verification from "../queries/verification.js";
import type * as supabaseTables from "../supabaseTables.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/verifySupabaseJwt": typeof actions_verifySupabaseJwt;
  "mutations/authors": typeof mutations_authors;
  "mutations/books": typeof mutations_books;
  "mutations/fixImageEntityIds": typeof mutations_fixImageEntityIds;
  "queries/activities": typeof queries_activities;
  "queries/authorList": typeof queries_authorList;
  "queries/authors": typeof queries_authors;
  "queries/bookAuthors": typeof queries_bookAuthors;
  "queries/bookImages": typeof queries_bookImages;
  "queries/bookList": typeof queries_bookList;
  "queries/books": typeof queries_books;
  "queries/debug": typeof queries_debug;
  "queries/discussions": typeof queries_discussions;
  "queries/entityImages": typeof queries_entityImages;
  "queries/events": typeof queries_events;
  "queries/follows": typeof queries_follows;
  "queries/friends": typeof queries_friends;
  "queries/groups": typeof queries_groups;
  "queries/photos": typeof queries_photos;
  "queries/publisherList": typeof queries_publisherList;
  "queries/publishers": typeof queries_publishers;
  "queries/readingProgress": typeof queries_readingProgress;
  "queries/reviews": typeof queries_reviews;
  "queries/users": typeof queries_users;
  "queries/verification": typeof queries_verification;
  supabaseTables: typeof supabaseTables;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
