import type { ImmutableObject } from "seamless-immutable"

export interface Config {
  useMapWidgetIds: string[]
  polygonSearchMethod: "interior-point" | "inward-buffer"
}

export type IMConfig = ImmutableObject<Config>