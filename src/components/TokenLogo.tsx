interface TokenLogoProps {
  src: string;
  symbol: string;
  size?: number;
}

export default function TokenLogo({ src, symbol, size = 20 }: TokenLogoProps) {
  return src ? (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
      }}
    />
  ) : (
    <div
      className="rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {symbol?.slice(0, 2).toUpperCase()}
    </div>
  );
}
