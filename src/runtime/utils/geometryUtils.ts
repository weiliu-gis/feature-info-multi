import * as bufferOperator from "@arcgis/core/geometry/operators/bufferOperator.js"

// Create a slightly smaller polygon for spatial queries
export const createInwardBuffer = (polygon: any) => {
  try {
    const bufferedPolygon = bufferOperator.execute(
      polygon,
      -0.1,
      { unit: "feet" },
    )

    if (!bufferedPolygon || bufferedPolygon.isEmpty) {
      console.warn("Inward buffer produced an empty polygon")
      return null
    }

    return bufferedPolygon
  } catch (error) {
    console.error("Inward buffer error:", error)
    return null
  }
}