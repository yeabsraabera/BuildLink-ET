export function fieldErrorMap(errors?: { path: string; message: string }[]) {
  const map: Record<string, string> = {};
  for (const item of errors ?? []) {
    const key = item.path.split(".")[0] || item.path;
    if (key && !map[key]) map[key] = item.message;
  }
  return map;
}

export function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="text-sm text-danger">
      {error}
    </p>
  );
}
