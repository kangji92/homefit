export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-danger mt-1 text-sm" role="alert">
      {message}
    </p>
  );
}
