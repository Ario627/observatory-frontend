export { ApiError, isApiError, type FailureCode } from "./client";

export {
  fetchActiveTarget,
  fetchCelestialPosition,
  fetchObjectsCatalog,
  fetchPassInfo,
  trackTarget,
} from "./celestial";

export { fetchHardwareOnline, fetchHardwareStatus } from "./hardware";

export { fetchCaptureHistory, triggerCapture } from "./capture";

export { isPin, signInWithPin, signOut, toPin, type Pin } from "./auth";
