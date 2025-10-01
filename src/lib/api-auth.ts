import { getStackServerApp } from "@/stack/server";
import { getViewerContext } from "@/server/auth";

export interface ApiAuthResult {
  success: true;
  viewer: NonNullable<Awaited<ReturnType<typeof getViewerContext>>>;
}

export interface ApiAuthError {
  success: false;
  error: string;
  status: number;
}

export type ApiAuthResponse = ApiAuthResult | ApiAuthError;

/**
 * Authenticate API requests and return viewer context
 * Used in API route handlers to ensure user is authenticated
 */
export async function authenticateApiRequest(): Promise<ApiAuthResponse> {
  try {
    const viewer = await getViewerContext();

    if (!viewer) {
      return {
        success: false,
        error: "Authentication required",
        status: 401
      };
    }

    return {
      success: true,
      viewer
    };
  } catch (error) {
    console.error("API authentication failed:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500
    };
  }
}

/**
 * Alternative method using Stack Auth directly with request context
 */
export async function authenticateApiRequestWithStackApp(): Promise<ApiAuthResponse> {
  try {
    const stackApp = getStackServerApp();
    const user = await stackApp.getUser({ or: "return-null" });

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        status: 401
      };
    }

    // Get viewer context for org information
    const viewer = await getViewerContext(user);

    if (!viewer) {
      return {
        success: false,
        error: "User context not found",
        status: 403
      };
    }

    return {
      success: true,
      viewer
    };
  } catch (error) {
    console.error("API authentication failed:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500
    };
  }
}