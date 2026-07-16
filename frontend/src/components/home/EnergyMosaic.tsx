import { useState } from "react";
import type { CSSProperties } from "react";
import type { EnergyType, HomeCell } from "./homeData";

interface EnergyMosaicProps {
  cells: HomeCell[];
}

interface EnergyTileProps {
  type: EnergyType;
}

interface PhotoTileProps {
  src: string;
  alt: string;
}

export function EnergyMosaic({ cells }: EnergyMosaicProps) {
  return (
    <div className="home-mosaic">
      {cells.map((cell, index) => (
        <div key={index} className="home-mosaic-cell">
          {cell.kind === "photo" ? (
            <PhotoTile src={cell.type.photoUrl} alt={cell.type.title} />
          ) : (
            <FlipTile type={cell.type} />
          )}
        </div>
      ))}
    </div>
  );
}

function PhotoTile({ src, alt }: PhotoTileProps) {
  const photoStyle = {
    "--photo-url": `url(${src})`,
  } as CSSProperties;

  return (
    <div
      className="home-photo-tile"
      style={photoStyle}
      role="img"
      aria-label={alt}
    />
  );
}

function FlipTile({ type }: EnergyTileProps) {
  const [flipped, setFlipped] = useState(false);

  const tileStyle = {
    "--tile-color": type.tileColor,
    "--tile-accent-color": type.accentColor,
  } as CSSProperties;

  const flipInnerClassName = flipped
    ? "home-flip-inner home-flip-inner-flipped"
    : "home-flip-inner home-flip-inner-not-flipped";

  return (
    <button
      type="button"
      className="home-flip-tile"
      style={tileStyle}
      onClick={() => setFlipped((currentValue) => !currentValue)}
      aria-label={`Learn more about ${type.title}`}
    >
      <div className={flipInnerClassName}>
        <div className="home-flip-side">
          <TextTileFront type={type} />
        </div>

        <div className="home-flip-side home-flip-back">
          <InfoTile type={type} />
        </div>
      </div>
    </button>
  );
}

function TextTileFront({ type }: EnergyTileProps) {
  return (
    <div className="home-text-tile-front">
      <p className="home-text-tile-title">{type.title}</p>

      <span className="home-text-tile-hint">Click to learn more →</span>
    </div>
  );
}

function InfoTile({ type }: EnergyTileProps) {
  return (
    <div className="home-info-tile">
      <div className="home-info-stat">
        <span className="home-info-stat-value">{type.stat.value}</span>

        <span className="home-info-stat-label">{type.stat.label}</span>
      </div>

      <div className="home-info-facts">
        {type.facts.map((fact) => (
          <div key={fact} className="home-info-fact">
            <span className="home-info-check">✓</span>

            <span className="home-info-fact-text">{fact}</span>
          </div>
        ))}
      </div>

      <p className="home-info-back-hint">Click to flip back</p>
    </div>
  );
}
