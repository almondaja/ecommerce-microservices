const gatewayUrl = (process.env.API_GATEWAY_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${gatewayUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const results = [];

  function pass(id, detail) {
    results.push(`PASS ${id}: ${detail}`);
  }

  const liveness = await request("/health/live");
  assert(liveness.status === 200 && liveness.body?.status === "alive", `TC-01 failed: HTTP ${liveness.status}`);
  pass("TC-01", "gateway liveness endpoint is alive");

  const readiness = await request("/health");
  if (readiness.status === 200) {
    pass("TC-02", "gateway reports all services online");
  } else {
    results.push(`FAIL TC-02: readiness degraded (${JSON.stringify(readiness.body)})`);
  }

  const email = `smoke-${Date.now()}@example.com`;
  const password = "SmokeTest123!";
  const registration = await request("/users/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test Buyer", email, password })
  });
  assert(registration.status === 201, `TC-03 failed: HTTP ${registration.status} ${JSON.stringify(registration.body)}`);
  pass("TC-03", "buyer registration succeeds");

  const login = await request("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const token = login.body?.data?.token;
  assert(login.status === 200 && token, `TC-05 failed: HTTP ${login.status} ${JSON.stringify(login.body)}`);
  pass("TC-05", "buyer login returns JWT");

  const duplicate = await request("/users/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test Buyer", email, password })
  });
  assert(duplicate.status === 409, `TC-04 failed: HTTP ${duplicate.status} ${JSON.stringify(duplicate.body)}`);
  pass("TC-04", "duplicate registration is rejected");

  const wrongLogin = await request("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "WrongPassword123!" })
  });
  assert(wrongLogin.status === 401, `TC-06 failed: HTTP ${wrongLogin.status} ${JSON.stringify(wrongLogin.body)}`);
  pass("TC-06", "wrong password is rejected");

  const unauthenticatedProfile = await request("/users/me");
  assert(unauthenticatedProfile.status === 401, `TC-07 failed: HTTP ${unauthenticatedProfile.status}`);
  pass("TC-07", "profile requires authentication");

  const authenticatedProfile = await request("/users/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(authenticatedProfile.status === 200, `TC-authenticated-profile failed: HTTP ${authenticatedProfile.status}`);

  const products = await request("/products?page=1&limit=5");
  assert(products.status === 200, `TC-08 failed: HTTP ${products.status} ${JSON.stringify(products.body)}`);
  pass("TC-08", "public product catalog responds");

  const buyerCreate = await request("/products", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: "Forbidden Smoke Product", price: 10000, stock: 1, category: "Smoke" })
  });
  assert(buyerCreate.status === 403, `TC-10 failed: HTTP ${buyerCreate.status} ${JSON.stringify(buyerCreate.body)}`);
  pass("TC-10", "buyer cannot create product");

  const unknown = await request("/unknown-smoke-path");
  assert(unknown.status === 404, `TC-21 failed: HTTP ${unknown.status}`);
  pass("TC-21", "unknown gateway path returns 404");

  console.log(results.join("\n"));
}

main().catch((error) => {
  console.error(`SMOKE TEST FAILED: ${error.message}`);
  process.exitCode = 1;
});
