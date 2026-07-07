/** flagcdn.com の SVG 国旗を表示するコンポーネント */
export default function Flag({
  code,
  size = 20,
}: {
  code: string;
  size?: number;
}) {
  if (!code) return <span className="flag-placeholder" style={{ width: size, height: size }} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="flag-img"
      src={`https://flagcdn.com/w${Math.ceil(size * 2)}/${code}.svg`}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
    />
  );
}
