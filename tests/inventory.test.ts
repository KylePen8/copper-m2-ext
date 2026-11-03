// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { readInventory, type InventoryRow } from "@/lib/copper/inventory";
import * as server from "@/lib/supabase/server";

afterEach(() => {
  vi.restoreAllMocks();
});

const ROWS: InventoryRow[] = [
  {
    sku: "CH-POL",
    product: "Copper Home",
    color: "Polished Copper",
    units_in_stock: 240,
    next_shipment: "2026-11-20",
  },
];

// A fake Supabase client whose inventory query resolves to `result`
// (or throws, when `result` is an Error).
function mockSupabase(result: { data: unknown; error: unknown } | Error) {
  const from = vi.fn(() => ({
    select: () => ({
      order: async () => {
        if (result instanceof Error) throw result;
        return result;
      },
    }),
  }));
  vi.spyOn(server, "createStatelessClient").mockReturnValue({
    from,
  } as unknown as ReturnType<typeof server.createStatelessClient>);
  return from;
}

describe("readInventory", () => {
  it("returns every row from the Supabase inventory table", async () => {
    const from = mockSupabase({ data: ROWS, error: null });
    expect(await readInventory()).toEqual(ROWS);
    expect(from).toHaveBeenCalledWith("inventory");
  });

  it("returns null when Supabase isn't set up", async () => {
    vi.spyOn(server, "createStatelessClient").mockReturnValue(null);
    expect(await readInventory()).toBeNull();
  });

  it("returns null when the query fails", async () => {
    mockSupabase({ data: null, error: { message: "relation does not exist" } });
    expect(await readInventory()).toBeNull();
  });

  it("returns null when Supabase can't be reached", async () => {
    mockSupabase(new Error("fetch failed"));
    expect(await readInventory()).toBeNull();
  });
});
