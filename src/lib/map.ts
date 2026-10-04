import "server-only";
import { geoMercator, geoPath, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import land110 from "world-atlas/land-110m.json";
import { lanes, office } from "@/content/locations";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 640;

export type MapData = {
  land: string;
  office: [number, number];
  lanes: { id: string; path: string; point: [number, number] }[];
};

/** Pre-render the map paths on the server so the browser only gets SVG strings. */
export function buildMap(): MapData {
  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
  const landFeature = feature(topo, topo.objects.land);

  // Frame Europe, the Middle East and Africa down to the equator.
  const frame = {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "MultiPoint" as const, coordinates: [[-18, 60], [62, 60], [-18, -8], [62, -8]] },
  };
  const projection = geoMercator().fitExtent(
    [
      [12, 12],
      [MAP_WIDTH - 12, MAP_HEIGHT - 12],
    ],
    frame,
  );
  const path = geoPath(projection);
  const project = (c: [number, number]) => projection(c) as [number, number];

  return {
    land: path(landFeature) ?? "",
    office: project(office.coords),
    lanes: lanes.map((lane) => {
      // Sample the great-circle route so it curves naturally on the flat map.
      const interpolate = geoInterpolate(office.coords, lane.coords);
      const coords = Array.from({ length: 33 }, (_, i) => interpolate(i / 32));
      return {
        id: lane.id,
        path: path({ type: "LineString", coordinates: coords }) ?? "",
        point: project(lane.coords),
      };
    }),
  };
}
