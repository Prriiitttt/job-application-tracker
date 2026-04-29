import { describe, it, expect } from "vitest";
import { findConnection, deriveConnectionState, filterDiscoverUsers } from "./connections";

const ME = "me-id";
const ALICE = "alice-id";
const BOB = "bob-id";

describe("findConnection", () => {
  const connections = [
    { id: 1, requester_id: ME, receiver_id: ALICE, status: "pending" },
    { id: 2, requester_id: BOB, receiver_id: ME, status: "accepted" },
  ];

  it("finds outgoing connection", () => {
    expect(findConnection(connections, ME, ALICE).id).toBe(1);
  });

  it("finds incoming connection", () => {
    expect(findConnection(connections, ME, BOB).id).toBe(2);
  });

  it("returns null when no match", () => {
    expect(findConnection(connections, ME, "nobody")).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(findConnection([], ME, ALICE)).toBeNull();
  });

  it("returns null for non-array input", () => {
    expect(findConnection(null, ME, ALICE)).toBeNull();
    expect(findConnection(undefined, ME, ALICE)).toBeNull();
  });

  it("ignores null entries in the array", () => {
    expect(findConnection([null, undefined], ME, ALICE)).toBeNull();
  });
});

describe("deriveConnectionState", () => {
  it("returns 'none' when no connection", () => {
    expect(deriveConnectionState(null, ME)).toBe("none");
    expect(deriveConnectionState(undefined, ME)).toBe("none");
  });

  it("returns 'accepted' for accepted status", () => {
    expect(
      deriveConnectionState({ status: "accepted", requester_id: ME, receiver_id: ALICE }, ME)
    ).toBe("accepted");
  });

  it("returns 'pending_outgoing' when current user requested", () => {
    expect(
      deriveConnectionState({ status: "pending", requester_id: ME, receiver_id: ALICE }, ME)
    ).toBe("pending_outgoing");
  });

  it("returns 'pending_incoming' when current user received", () => {
    expect(
      deriveConnectionState({ status: "pending", requester_id: ALICE, receiver_id: ME }, ME)
    ).toBe("pending_incoming");
  });

  it("returns 'none' for declined status", () => {
    expect(
      deriveConnectionState({ status: "declined", requester_id: ME, receiver_id: ALICE }, ME)
    ).toBe("none");
  });

  it("returns 'none' for unknown status", () => {
    expect(
      deriveConnectionState({ status: "weird", requester_id: ME, receiver_id: ALICE }, ME)
    ).toBe("none");
  });
});

describe("filterDiscoverUsers", () => {
  const users = [
    { id: ALICE, username: "alice", full_name: "Alice Wonderland" },
    { id: BOB, username: "bobsmith", full_name: "Bob Smith" },
    { id: "carol-id", username: "carol", full_name: null },
  ];

  it("returns all users when no query and no connections", () => {
    expect(filterDiscoverUsers(users, [], ME)).toHaveLength(3);
  });

  it("hides users connected via accepted connection", () => {
    const conns = [{ requester_id: ME, receiver_id: ALICE, status: "accepted" }];
    const result = filterDiscoverUsers(users, conns, ME);
    expect(result.find((u) => u.id === ALICE)).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it("does NOT hide users with pending connections", () => {
    const conns = [{ requester_id: ME, receiver_id: ALICE, status: "pending" }];
    expect(filterDiscoverUsers(users, conns, ME)).toHaveLength(3);
  });

  it("filters by query case-insensitively against username", () => {
    expect(filterDiscoverUsers(users, [], ME, "ALICE")).toHaveLength(1);
  });

  it("filters by query against full_name", () => {
    expect(filterDiscoverUsers(users, [], ME, "smith")).toHaveLength(1);
  });

  it("returns empty when nothing matches", () => {
    expect(filterDiscoverUsers(users, [], ME, "zzz")).toEqual([]);
  });

  it("handles users with null full_name", () => {
    expect(filterDiscoverUsers(users, [], ME, "carol")).toHaveLength(1);
  });

  it("returns empty for non-array users", () => {
    expect(filterDiscoverUsers(null, [], ME)).toEqual([]);
  });
});
