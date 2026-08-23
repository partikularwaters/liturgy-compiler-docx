import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Missing local Supabase environment variables. Run npm run env:check first.");
}

const hostname = new URL(url).hostname;
if (hostname !== "127.0.0.1" && hostname !== "localhost") {
  throw new Error(`Refusing to run database contract checks against non-local host: ${hostname}`);
}

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function pass(message) {
  console.log(`✓ ${message}`);
}

function requireSuccess(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function requireDenied(error, context) {
  if (!error) throw new Error(`${context}: access was unexpectedly allowed`);
  pass(context);
}

let testUserId;
let testLiturgyId;

try {
  const { data: templates, error: templateError } = await service
    .from("templates")
    .select("id, name")
    .limit(1);
  requireSuccess(templateError, "service_role could not read templates");
  if (!templates?.length) throw new Error("No template exists for the create_liturgy check");
  pass("service_role can read application tables");

  const { data: liturgyId, error: createError } = await service.rpc("create_liturgy", {
    p_template_id: templates[0].id,
    p_service_date: "2099-12-31",
    p_lords_day_number: 53,
  });
  requireSuccess(createError, "service_role could not call create_liturgy");
  testLiturgyId = liturgyId;

  const { count: sectionCount, error: sectionError } = await service
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("liturgy_id", testLiturgyId);
  requireSuccess(sectionError, "service_role could not inspect created sections");
  if (!sectionCount) throw new Error("create_liturgy returned without creating sections");
  pass("create_liturgy works as one complete server-side operation");

  const { error: anonReadError } = await anon.from("liturgies").select("id").limit(1);
  requireDenied(anonReadError, "anon cannot read database tables directly");

  const { error: anonRpcError } = await anon.rpc("create_liturgy", {
    p_template_id: templates[0].id,
    p_service_date: "2099-12-30",
    p_lords_day_number: 52,
  });
  requireDenied(anonRpcError, "anon cannot create a liturgy through the database RPC");

  const email = `db-contract-${crypto.randomUUID()}@example.test`;
  const password = `Local-only-${crypto.randomUUID()}!`;
  const { data: createdUser, error: createUserError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  requireSuccess(createUserError, "could not create disposable local auth user");
  testUserId = createdUser.user.id;

  const { error: roleInsertError } = await service.from("user_roles").insert({
    user_id: testUserId,
    role: "pending",
    first_name: "Local",
    last_name: "Contract Check",
  });
  requireSuccess(roleInsertError, "could not create disposable local role row");

  const authenticated = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await authenticated.auth.signInWithPassword({ email, password });
  requireSuccess(signInError, "disposable local user could not sign in");

  const { data: ownRole, error: ownRoleError } = await authenticated
    .from("user_roles")
    .select("role")
    .eq("user_id", testUserId)
    .single();
  requireSuccess(ownRoleError, "authenticated user could not read its role");
  if (ownRole.role !== "pending") throw new Error("authenticated role lookup returned the wrong row");
  pass("authenticated users can read the role information needed by the app");

  const { error: authenticatedReadError } = await authenticated
    .from("liturgies")
    .select("id")
    .limit(1);
  requireDenied(authenticatedReadError, "authenticated users cannot bypass the app to read liturgies");

  const { error: authenticatedRpcError } = await authenticated.rpc("create_liturgy", {
    p_template_id: templates[0].id,
    p_service_date: "2099-12-29",
    p_lords_day_number: 51,
  });
  requireDenied(authenticatedRpcError, "authenticated users cannot bypass the app to create liturgies");

  console.log("\nLocal database contract verified.");
} finally {
  if (testLiturgyId) {
    const { error } = await service.from("liturgies").delete().eq("id", testLiturgyId);
    if (error) console.warn(`Cleanup warning (liturgy): ${error.message}`);
  }
  if (testUserId) {
    const { error } = await service.auth.admin.deleteUser(testUserId);
    if (error) console.warn(`Cleanup warning (auth user): ${error.message}`);
  }
}

