import * as bufferOperator from "@arcgis/core/geometry/operators/bufferOperator.js";

// Retrieve popup-enabled features at a screen point or rectangle
export const retrievePopupFeatures = async (
  mapComponent: any,
  hitTarget: any,
  pointerType: any = "mouse",
): Promise<any[]> => {
  const graphicGenerator = await mapComponent.fetchPopupFeatures(hitTarget, {
    pointerType,
  });

  const graphics: any[] = [];

  for await (const graphic of graphicGenerator) {
    graphics.push(graphic);
  }

  return graphics;
};

// Retrieve popup-enabled features intersecting a polygon
export const retrieveSpatialFeatures = async (
  view: any,
  geometry: any,
): Promise<any[]> => {
  // Apply a small tolerance to external point geometries
  const POINT_TOLERANCE_FEET = 2;

  let queryGeometry = geometry;

  if (geometry?.type === "point") {
    try {
      queryGeometry =
        bufferOperator.execute(geometry, POINT_TOLERANCE_FEET, {
          unit: "feet",
        }) ?? geometry;
    } catch (error) {
      console.warn("Point tolerance buffer error:", error);
    }
  }

  // Check visibility, including parent layers
  const isVisible = (layer: any) => {
    let current = layer;

    while (current) {
      if (current.visible === false) return false;
      current = current.parent;
    }

    return true;
  };

  const queryLayers: any[] = [];

  // Collect popup-enabled Feature Layers and Map Image sublayers
  for (const layer of view.map.allLayers.toArray()) {
    if (!isVisible(layer)) continue;

    if (layer.type === "feature") {
      if (layer.popupEnabled && layer.popupTemplate) {
        queryLayers.push(layer);
      }
    }

    if (layer.type === "map-image") {
      try {
        await layer.load();

        layer.allSublayers.forEach((sublayer: any) => {
          if (
            isVisible(sublayer) &&
            (sublayer.sublayers?.length ?? 0) === 0 &&
            sublayer.popupEnabled &&
            sublayer.popupTemplate
          ) {
            queryLayers.push(sublayer);
          }
        });
      } catch (error) {
        console.error("Map Image Layer load error:", error);
      }
    }
  }

  console.log("Spatial query layers:", queryLayers.length);

  // Query each layer independently
  const results = await Promise.all(
    queryLayers.map(async (layer) => {
      try {
        const query = layer.createQuery();

        query.geometry = queryGeometry;
        query.spatialRelationship = "intersects";
        query.outFields = ["*"];
        query.returnGeometry = true;

        const featureSet = await layer.queryFeatures(query);

        return featureSet.features.map((graphic: any) => {
          // Preserve the WebMap popup configuration
          graphic.layer = layer;
          graphic.popupTemplate = layer.popupTemplate;

          return graphic;
        });
      } catch (error) {
        console.error(`Spatial query error: ${layer.title}`, error);
        return [];
      }
    }),
  );

  return results.flat();
};
