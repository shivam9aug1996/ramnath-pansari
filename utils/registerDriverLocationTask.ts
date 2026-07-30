/**
 * Native: register TaskManager.defineTask early (required for background location wakes).
 * Web override is a no-op — see registerDriverLocationTask.web.ts.
 */
import "@/utils/driverLocationTask";
