import type { JimuMapView } from "jimu-arcgis"
import type Graphic from "@arcgis/core/Graphic.js"
import type Geometry from "@arcgis/core/geometry/Geometry.js"

import type { UnifiedGeometryInput } from "../types"
import { retrievePopupFeatures } from "./featureRetrieval"
import { retrieveFeaturesFromGeometryInput } from "./geometryInputProcessor"

export interface FeatureInputResult {
  graphics: Graphic[]
  queryGeometries: Geometry[]
}

export const processFeatureInput = async (
  input: UnifiedGeometryInput,
  jimuMapView: JimuMapView,
): Promise<FeatureInputResult> => {
  if (!jimuMapView?.view || !input.geometries.length) {
    return { graphics: [], queryGeometries: [] }
  }

  if (input.retrievalMethod === "popup") {
    if (!jimuMapView.mapComponent) {
      return { graphics: [], queryGeometries: [] }
    }

    const graphics = await retrievePopupFeatures(
      jimuMapView.mapComponent,
      input.hitTarget,
      input.pointerType ?? "mouse",
    )
    return { graphics, queryGeometries: input.geometries }
  }

  // All other supported widgets use the same spatial workflow.
  return retrieveFeaturesFromGeometryInput(jimuMapView, input)
}
