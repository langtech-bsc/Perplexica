let initialized = false;

export async function runInitLogicOnce() {
  if (initialized) return;

  initialized = true;

  console.log('🚀 Running server startup logic...');
  // Put your backend logic here:
  // - preload models
  // - load remote config
  // - warm up cache
  // - log startup event
}