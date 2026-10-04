"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";

type Lane = {
  id: string;
  to: string;
  region: string;
  modes: { key: string; label: string }[];
  path: string;
  point: [number, number];
  quoteHref: string;
};

type Props = {
  width: number;
  height: number;
  land: string;
  office: [number, number];
  officeName: string;
  lanes: Lane[];
  labels: { mapLabel: string; modes: string; quoteRoute: string };
};

const modeIcon: Record<string, string> = { sea: "ship", air: "plane", road: "truck" };

/** Route list and map side by side: picking a route highlights it on the map. */
export function RouteMap({ width, height, land, office, officeName, lanes, labels }: Props) {
  const [active, setActive] = useState(lanes[0]?.id);
  const current = lanes.find((l) => l.id === active);

  return (
    <div className="route-map">
      <ul className="route-list">
        {lanes.map((lane) => (
          <li key={lane.id}>
            <button
              type="button"
              className="route-list__item"
              aria-pressed={lane.id === active}
              onClick={() => setActive(lane.id)}
              onMouseEnter={() => setActive(lane.id)}
              onFocus={() => setActive(lane.id)}
            >
              <span className="route-list__to">
                {officeName} <span aria-hidden="true" className="route-arrow">→</span> {lane.to}
              </span>
              <span className="route-list__region">{lane.region}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="tfs-card route-map__panel">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.mapLabel} className="route-map__svg">
          <path d={land} className="map-land" />
          {lanes.map((lane) => (
            <path key={lane.id} d={lane.path} className={`map-lane${lane.id === active ? " is-active" : ""}`} />
          ))}
          {lanes.map((lane) => (
            <circle
              key={lane.id}
              cx={lane.point[0]}
              cy={lane.point[1]}
              r={lane.id === active ? 7 : 5}
              className={`map-port${lane.id === active ? " is-active" : ""}`}
            />
          ))}
          <circle cx={office[0]} cy={office[1]} r={9} className="map-office" />
          <text x={office[0] + 14} y={office[1] + 5} className="map-label">
            {officeName}
          </text>
          {current ? (
            <text x={current.point[0] + 12} y={current.point[1] + 5} className="map-label map-label--active">
              {current.to}
            </text>
          ) : null}
        </svg>
        {current ? (
          <div className="route-map__detail" aria-live="polite">
            <div>
              <p className="tfs-h3">
                {officeName} <span aria-hidden="true" className="route-arrow">→</span> {current.to}
              </p>
              <p className="route-map__modes">
                <span className="visually-hidden">{labels.modes}: </span>
                {current.modes.map((m) => (
                  <span key={m.key} className="mode-chip">
                    <Icon name={modeIcon[m.key] ?? "ship"} size={16} />
                    {m.label}
                  </span>
                ))}
              </p>
            </div>
            <Link href={current.quoteHref} className="tfs-btn tfs-btn--secondary tfs-btn--sm">
              {labels.quoteRoute}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
