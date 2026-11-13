import { Role } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/config/prisma", () => ({ prisma: {} }));

const { canAutoLinkGoogle } = await import("../../src/controllers/auth.controller");

describe("canAutoLinkGoogle", () => {
  it("links only Gmail customer accounts automatically", () => {
    expect(canAutoLinkGoogle("aysel@gmail.com", Role.CUSTOMER)).toBe(true);
    expect(canAutoLinkGoogle("aysel@company.az", Role.CUSTOMER)).toBe(false);
    expect(canAutoLinkGoogle("admin@gmail.com", Role.ADMIN)).toBe(false);
    expect(canAutoLinkGoogle("support@gmail.com", Role.SUPPORT)).toBe(false);
  });
});
