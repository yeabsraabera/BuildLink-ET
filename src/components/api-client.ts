export type ApiResult<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: { path: string; message: string }[];
};

export async function readApi<T>(response: Response): Promise<ApiResult<T>> {
  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return { success: false, message: "Could not read the server response" };
  }
}

export function errorText<T>(body: ApiResult<T>, fallback: string) {
  return body.errors?.[0]?.message || body.message || fallback;
}
