import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isKindCareOwner, ownerEmailFromEnv } from "./owner.ts";

describe("owner authorization", () => {
  it("fails closed when the owner email env var is missing", () => {
    assert.equal(ownerEmailFromEnv({}), null);
    assert.equal(isKindCareOwner("info@kindcare.app", {}), false);
  });

  it("matches the signed-in email, not user metadata", () => {
    const env = { KINDCARE_OWNER_EMAIL: "info@kindcare.app" };
    assert.equal(isKindCareOwner("info@kindcare.app", env), true);
    assert.equal(isKindCareOwner("  INFO@kindcare.app ", env), true);
    assert.equal(isKindCareOwner("anne@example.com", env), false);
    assert.equal(isKindCareOwner(null, env), false);
  });
});
