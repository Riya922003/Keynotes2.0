// A stable instance identifier for this runtime. If you want to set a fixed
// id (e.g., in production), set REALTIME_INSTANCE_ID in your environment.
export const INSTANCE_ID = process.env.REALTIME_INSTANCE_ID ?? `inst_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
