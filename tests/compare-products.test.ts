// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  compareProducts,
  compareProductsInput,
  copperTools,
} from "@/lib/copper/assistant/tools";
import { getProducts } from "@/lib/copper/catalog";

describe("compare_products", () => {
  it("puts the two products side by side from the catalog", () => {
    const result = compareProducts({
      productA: "copper-home",
      productB: "copper-notes",
    });
    if (result.status !== "ok") throw new Error("expected a comparison");
    const catalog = getProducts();
    expect(result.products.map((p) => p.id)).toEqual([
      "copper-home",
      "copper-notes",
    ]);
    for (const product of result.products) {
      const source = catalog.find((p) => p.id === product.id)!;
      expect(product.name).toBe(source.name);
      expect(product.priceUsd).toBe(source.priceUsd);
      expect(product.colors).toEqual(source.colors);
      expect(product.features).toEqual(source.features);
    }
  });

  it("says which is cheaper and by how much", () => {
    const result = compareProducts({
      productA: "copper-home",
      productB: "copper-notes",
    });
    if (result.status !== "ok") throw new Error("expected a comparison");
    const [home, notes] = result.products;
    expect(result.priceDifferenceUsd).toBe(
      Math.abs(home.priceUsd - notes.priceUsd),
    );
    expect(result.cheaper).toBe(
      home.priceUsd < notes.priceUsd ? home.name : notes.name,
    );
  });

  it("gives the same answer whichever order the products come in", () => {
    const ab = compareProducts({
      productA: "copper-home",
      productB: "copper-notes",
    });
    const ba = compareProducts({
      productA: "copper-notes",
      productB: "copper-home",
    });
    if (ab.status !== "ok" || ba.status !== "ok")
      throw new Error("expected comparisons");
    expect(ba.priceDifferenceUsd).toBe(ab.priceDifferenceUsd);
    expect(ba.cheaper).toBe(ab.cheaper);
  });

  it("asks for two different products instead of comparing one with itself", () => {
    expect(
      compareProducts({ productA: "copper-home", productB: "copper-home" }),
    ).toEqual({
      status: "error",
      message: "Pick two different products to compare.",
    });
  });

  it("rejects a product that isn't in the catalog", () => {
    expect(
      compareProductsInput.safeParse({
        productA: "copper-home",
        productB: "copper-toaster",
      }).success,
    ).toBe(false);
    expect(
      compareProductsInput.safeParse({ productA: "copper-home" }).success,
    ).toBe(false);
  });

  it("is one of the tools the model can call, with a description", () => {
    expect(copperTools.compare_products.description).toBeTruthy();
  });
});
