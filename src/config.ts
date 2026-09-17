import type { ImmutableObject } from "seamless-immutable"

export interface Config {
  useMapWidgetIds: string[]
}

export type IMConfig = ImmutableObject<Config>