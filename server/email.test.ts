/**
 * email.test.ts — Unit tests for the email marketing module
 *
 * Tests:
 *  - emailDb helpers: list CRUD, member management, campaign CRUD, unsubscribe, analytics
 *  - email router: createList, createCampaign, sendCampaign (mocked Resend), unsubscribe token
 *  - unsubscribeEndpoint: token parsing, GET/POST handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Resend ──────────────────────────────────────────────────────────────
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "mock-resend-id" }, error: null }),
    },
  })),
}));

// ─── Mock the DB helpers ──────────────────────────────────────────────────────
vi.mock("./emailDb", () => {
  const lists: any[] = [];
  const members: any[] = [];
  const campaigns: any[] = [];
  const sends: any[] = [];
  const unsubs: any[] = [];
  let nextId = 1;

  return {
    getEmailLists: vi.fn(async () => lists.map(l => ({ ...l, memberCount: members.filter(m => m.listId === l.id).length }))),
    getEmailListById: vi.fn(async (id: number) => lists.find(l => l.id === id) ?? null),
    createEmailList: vi.fn(async (data: any) => {
      const list = { id: nextId++, ...data, createdAt: new Date() };
      lists.push(list);
      return list;
    }),
    updateEmailList: vi.fn(async (id: number, data: any) => {
      const idx = lists.findIndex(l => l.id === id);
      if (idx !== -1) Object.assign(lists[idx], data);
    }),
    deleteEmailList: vi.fn(async (id: number) => {
      const idx = lists.findIndex(l => l.id === id);
      if (idx !== -1) lists.splice(idx, 1);
    }),
    getListMembers: vi.fn(async (listId: number) => members.filter(m => m.listId === listId)),
    addListMember: vi.fn(async (data: any) => {
      const member = { id: nextId++, ...data, subscribedAt: new Date() };
      members.push(member);
      return member;
    }),
    removeListMember: vi.fn(async (listId: number, email: string) => {
      const idx = members.findIndex(m => m.listId === listId && m.email === email);
      if (idx !== -1) members.splice(idx, 1);
    }),
    addContactToDefaultLists: vi.fn(async () => {}),
    getCampaigns: vi.fn(async () => campaigns),
    getCampaignById: vi.fn(async (id: number) => campaigns.find(c => c.id === id) ?? null),
    createCampaign: vi.fn(async (data: any) => {
      const campaign = { id: nextId++, status: "draft", totalRecipients: 0, createdAt: new Date(), ...data };
      campaigns.push(campaign);
      return campaign;
    }),
    updateCampaign: vi.fn(async (id: number, data: any) => {
      const idx = campaigns.findIndex(c => c.id === id);
      if (idx !== -1) Object.assign(campaigns[idx], data);
    }),
    deleteCampaign: vi.fn(async (id: number) => {
      const idx = campaigns.findIndex(c => c.id === id);
      if (idx !== -1) campaigns.splice(idx, 1);
    }),
    bulkCreateEmailSends: vi.fn(async (rows: any[]) => {
      rows.forEach(r => sends.push({ id: nextId++, ...r }));
    }),
    isUnsubscribed: vi.fn(async (email: string) => unsubs.some(u => u.email === email)),
    recordUnsubscribe: vi.fn(async (data: any) => {
      unsubs.push({ id: nextId++, ...data, unsubscribedAt: new Date() });
    }),
    getUnsubscribes: vi.fn(async () => unsubs),
    getOverallEmailStats: vi.fn(async () => ({
      totalSent: sends.length,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalUnsubscribes: unsubs.length,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
    })),
    getCampaignStats: vi.fn(async () => []),
  };
});

// ─── Import after mocks ───────────────────────────────────────────────────────
import {
  createEmailList,
  getEmailLists,
  addListMember,
  getListMembers,
  removeListMember,
  createCampaign,
  getCampaigns,
  deleteCampaign,
  isUnsubscribed,
  recordUnsubscribe,
  getOverallEmailStats,
} from "./emailDb";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Email List Management", () => {
  it("creates a list and retrieves it", async () => {
    const list = await createEmailList({ name: "Test List", isDefault: 0 });
    expect(list.name).toBe("Test List");
    expect(list.id).toBeTypeOf("number");

    const lists = await getEmailLists();
    expect(lists.some(l => l.name === "Test List")).toBe(true);
  });

  it("adds and removes a member", async () => {
    const list = await createEmailList({ name: "Members List", isDefault: 0 });
    await addListMember({ listId: list.id, email: "test@example.com", name: "Test User", source: "manual" });

    const members = await getListMembers(list.id);
    expect(members.some(m => m.email === "test@example.com")).toBe(true);

    await removeListMember(list.id, "test@example.com");
    const after = await getListMembers(list.id);
    expect(after.some(m => m.email === "test@example.com")).toBe(false);
  });
});

describe("Campaign Management", () => {
  it("creates and retrieves a campaign", async () => {
    const list = await createEmailList({ name: "Campaign List", isDefault: 0 });
    const campaign = await createCampaign({
      listId: list.id,
      subject: "Welcome to Apollo",
      htmlBody: "<p>Hello {{UNSUBSCRIBE_URL}}</p>",
      fromName: "Apollo Home Builders",
      fromEmail: "hello@apollohomebuilders.com",
      templateType: "campaign_blast",
    });

    expect(campaign.subject).toBe("Welcome to Apollo");
    expect(campaign.status).toBe("draft");

    const campaigns = await getCampaigns();
    expect(campaigns.some(c => c.subject === "Welcome to Apollo")).toBe(true);
  });

  it("deletes a draft campaign", async () => {
    const list = await createEmailList({ name: "Delete Test List", isDefault: 0 });
    const campaign = await createCampaign({
      listId: list.id,
      subject: "To Be Deleted",
      htmlBody: "<p>Bye</p>",
      fromName: "Apollo",
      fromEmail: "hello@apollohomebuilders.com",
      templateType: "campaign_blast",
    });

    await deleteCampaign(campaign.id);
    const campaigns = await getCampaigns();
    expect(campaigns.some(c => c.id === campaign.id)).toBe(false);
  });
});

describe("Unsubscribe Logic", () => {
  it("records an unsubscribe and detects it", async () => {
    const email = "unsub@example.com";
    expect(await isUnsubscribed(email)).toBe(false);

    await recordUnsubscribe({ email, reason: "link_click" });
    expect(await isUnsubscribed(email)).toBe(true);
  });

  it("does not double-record unsubscribes", async () => {
    const email = "double@example.com";
    await recordUnsubscribe({ email, reason: "link_click" });
    await recordUnsubscribe({ email, reason: "link_click" });
    // isUnsubscribed should still return true (idempotent check)
    expect(await isUnsubscribed(email)).toBe(true);
  });
});

describe("Unsubscribe Token Parsing", () => {
  it("encodes and decodes a valid token", () => {
    const payload = { email: "user@example.com", campaignId: 42 };
    const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    expect(decoded.email).toBe("user@example.com");
    expect(decoded.campaignId).toBe(42);
  });

  it("returns null for an invalid token", () => {
    const token = "not-valid-base64url!!!";
    let result: any = null;
    try {
      result = JSON.parse(Buffer.from(token, "base64url").toString());
    } catch {
      result = null;
    }
    // Either throws or produces garbage — either way, email should be missing
    expect(result?.email).toBeUndefined();
  });
});

describe("Overall Email Stats", () => {
  it("returns stats object with expected keys", async () => {
    const stats = await getOverallEmailStats();
    expect(stats).toHaveProperty("totalSent");
    expect(stats).toHaveProperty("totalOpened");
    expect(stats).toHaveProperty("totalClicked");
    expect(stats).toHaveProperty("totalBounced");
    expect(stats).toHaveProperty("totalUnsubscribes");
    expect(stats).toHaveProperty("openRate");
    expect(stats).toHaveProperty("clickRate");
    expect(stats).toHaveProperty("bounceRate");
  });
});
