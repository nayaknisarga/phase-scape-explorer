import { describe, expect, it } from "vitest";
import { isClinicalQuery } from "@/lib/product-guard";

describe("product search guardrail", () => {
  it("blocks contraceptive pills", () => expect(isClinicalQuery("contraceptive pills India")).toBe(true));
  it("blocks prescription medicine", () => expect(isClinicalQuery("prescription period medicine")).toBe(true));
  it("allows everyday care items", () => expect(isClinicalQuery("overnight sanitary pad heavy flow India")).toBe(false));
});
