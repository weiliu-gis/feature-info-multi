import Graphic from "@arcgis/core/Graphic.js"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js"
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol.js"

// Show the clicked map location
export const showFeaturePoint = (
  markerLayer: GraphicsLayer | undefined,
  point: any,
  view: any,
) => {
  if (!view?.stationary) return
  if (!markerLayer || !point) return

  markerLayer.removeAll()

  const pinGraphic = new Graphic({
    geometry: point,
    symbol: new PictureMarkerSymbol({
      url: "https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
      width: "40px",
      height: "40px",
      yoffset: "15px",
    }),
  })

  markerLayer.add(pinGraphic)
}

// Highlight a selected feature on the map
export const highlightFeature = (
  selectionLayer: GraphicsLayer,
  geometry: any,
) => {
  const selectionGraphic = new Graphic({
    geometry,
  })

  if (geometry.type === "polygon") {
    selectionGraphic.symbol = {
      type: "simple-fill",
      color: [0, 255, 255, 0.15],
      outline: {
        color: [0, 255, 255, 1],
        width: 2,
      },
    } as any
  }

  if (geometry.type === "polyline") {
    selectionGraphic.symbol = {
      type: "simple-line",
      color: [0, 255, 255, 1],
      width: 4,
    } as any
  }

  if (geometry.type === "point") {
    selectionGraphic.symbol = {
      type: "simple-marker",
      color: [0, 255, 255, 0.35],
      size: 16,
      outline: {
        color: [0, 255, 255, 1],
        width: 2,
      },
    } as any
  }

  selectionLayer.add(selectionGraphic)
}


// Display one or more geometries from other widgets
export const showInputGeometries = (
  markerLayer: any,
  geometries: any[],
) => {
  if (!markerLayer) return

  // Clear previous location graphics only once
  markerLayer.removeAll()

  for (const geometry of geometries) {
    if (!geometry) continue

    let symbol: any

    if (geometry.type === "point") {
      // Use the same red pin as Map Click
      symbol = new PictureMarkerSymbol({
        url: "https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
        width: "40px",
        height: "40px",
        yoffset: "15px",
      })
    } else if (geometry.type === "polyline") {
      // Dark line with no fill
      symbol = {
        type: "simple-line",
        color: [56, 56, 56, 1],
        width: 3,
      }
    } else if (geometry.type === "polygon") {
      // Transparent polygon with a grey outline
      symbol = {
        type: "simple-fill",
        color: [0, 0, 0, 0],
        outline: {
          color: [56, 56, 56, 1],
          width: 3,
        },
      }
    } else {
      continue
    }

    markerLayer.add(
      new Graphic({
        geometry,
        symbol,
      }),
    )
  }
}
