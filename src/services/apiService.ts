import { API_BASE_URL, API_TIMEOUT } from "@/config/apiConfig";

/**
 * Generic API service for making HTTP requests
 */

type RequestOptions = {
  headers?: Record<string, string>;
  timeout?: number;
};

type RequestBody = Record<string, any> | FormData;

/**
 * Handles API errors and returns a standardized error object
 */
const handleApiError = async (response: Response) => {
  let errorMessage = "An unexpected error occurred";
  let errorData = {};

  try {
    errorData = await response.json();
    errorMessage =
      errorData?.message || `Error: ${response.status} ${response.statusText}`;
  } catch (e) {
    errorMessage = `Error: ${response.status} ${response.statusText}`;
  }

  const error = new Error(errorMessage) as Error & {
    status?: number;
    data?: any;
  };
  error.status = response.status;
  error.data = errorData;

  throw error;
};

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
const timeoutPromise = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
};

/**
 * Makes a fetch request with timeout
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number,
) => {
  return Promise.race([fetch(url, options), timeoutPromise(timeout)]);
};

/**
 * Base API request function
 */
const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: RequestBody,
  options: RequestOptions = {},
): Promise<T> => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  const timeout = options.timeout || API_TIMEOUT;

  const headers: Record<string, string> = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData as the browser will set it with the boundary
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetchWithTimeout(url, fetchOptions, timeout);

    if (!response.ok) {
      return handleApiError(response);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
};

/**
 * Upload a file to the server
 */
export const uploadFile = async (
  file: File,
  uploadUrl: string = "/upload",
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<{ url: string }>(uploadUrl, "POST", formData);
};

/**
 * API service methods
 */
export const apiService = {
  /**
   * Make a GET request
   */
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, "GET", undefined, options);
  },

  /**
   * Make a POST request
   */
  post: <T>(
    endpoint: string,
    data: RequestBody,
    options?: RequestOptions,
  ): Promise<T> => {
    return apiRequest<T>(endpoint, "POST", data, options);
  },

  /**
   * Make a PUT request
   */
  put: <T>(
    endpoint: string,
    data: RequestBody,
    options?: RequestOptions,
  ): Promise<T> => {
    return apiRequest<T>(endpoint, "PUT", data, options);
  },

  /**
   * Make a PATCH request
   */
  patch: <T>(
    endpoint: string,
    data: RequestBody,
    options?: RequestOptions,
  ): Promise<T> => {
    return apiRequest<T>(endpoint, "PATCH", data, options);
  },

  /**
   * Make a DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
    return apiRequest<T>(endpoint, "DELETE", undefined, options);
  },

  /**
   * Upload a file
   */
  uploadFile,
};
