import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isKindCareOwner, isOwnerAppPath, ownerEmailFromEnv, ownerSignInHref } from "./owner.ts";

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

  it("keeps the owner sign-in on its own path", () => {
    assert.equal(isOwnerAppPath("/owner"), true);
    assert.equal(isOwnerAppPath("/owner/sign-in"), true);
    assert.equal(isOwnerAppPath("/today"), false);
    assert.equal(ownerSignInHref("/owner"), "/owner/sign-in?next=%2Fowner");
  });
});
