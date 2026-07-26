export function Flag({ country }: { country: string }) {
  return (
    <span
      className={`fi fi-${country.toLowerCase()} rounded-[3px]`}
      aria-hidden="true"
    />
  );
}
