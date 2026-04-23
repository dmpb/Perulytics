export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export function ok<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}
