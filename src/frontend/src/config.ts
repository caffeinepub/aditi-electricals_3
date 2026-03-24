// Legacy config stub - not used in Supabase-backed app
export async function loadConfig() {
  return {
    backend_host: undefined as string | undefined,
    backend_canister_id: "",
    storage_gateway_url: "",
    bucket_name: "",
    project_id: "",
    ii_derivation_origin: undefined as string | undefined,
  };
}

export async function createActorWithConfig() {
  throw new Error("ICP backend not used in this app");
}
