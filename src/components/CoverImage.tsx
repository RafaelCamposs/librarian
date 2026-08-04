export function CoverImage({
  coverUrl,
  width,
  height,
}: {
  coverUrl: string | null | undefined;
  width: number;
  height: number;
}) {
  return (
    <div class="cover-slot" style={{ width, height }}>
      {coverUrl ? (
        <img src={coverUrl} alt="" loading="lazy" />
      ) : (
        <div class="cover-placeholder">no cover</div>
      )}
    </div>
  );
}
