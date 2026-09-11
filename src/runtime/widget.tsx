import { React, type AllWidgetProps } from "jimu-core";
import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis";

const { useState, useEffect } = React;

const Widget = (props: AllWidgetProps<any>) => {
  // ------------------------------------------------------------
  // Store the active JimuMapView from the Experience Builder map
  // ------------------------------------------------------------
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>();

  // ------------------------------------------------------------
  // Store our layer registry
  //
  // Each entry contains:
  // - title
  // - type
  // - actual ArcGIS layer/sublayer
  // - parent layer, if it is a sublayer
  // - whether it is a sublayer
  // ------------------------------------------------------------
  const [layerRegistry, setLayerRegistry] = useState<any[]>([]);

  // ------------------------------------------------------------
  // Store the graphics/features returned from identify
  // ------------------------------------------------------------
  const [identifiedFeatures, setIdentifiedFeatures] = useState<any[]>([]);

  // ------------------------------------------------------------
  // Called by JimuMapViewComponent whenever the active map
  // view changes.
  // ------------------------------------------------------------
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv);
    }
  };

  const handleBlockClick = async (graphic: any) => {
    if (!jimuMapView?.view || !graphic?.geometry) {
      return;
    }

    try {
      await jimuMapView.view.goTo(graphic.geometry);
    } catch (error) {
      console.error("Zoom to feature error:", error);
    }
  };

  // ============================================================
  // BUILD LAYER REGISTRY
  // ============================================================

  useEffect(() => {
    if (!jimuMapView) {
      return;
    }

    // Get the layer views managed by Experience Builder
    const jimuLayerViews = jimuMapView.jimuLayerViews;

    if (!jimuLayerViews) {
      return;
    }

    const registry: any[] = [];

    // ----------------------------------------------------------
    // Loop through all operational layer views
    // ----------------------------------------------------------
    Object.values(jimuLayerViews).forEach((jimuLayerView: any) => {
      const layer = jimuLayerView.layer;

      if (!layer) {
        return;
      }

      // ------------------------------------------------------
      // Add the top-level layer
      // ------------------------------------------------------
      registry.push({
        title: layer.title,
        type: layer.type,
        layer: layer,
        parent: null,
        isSublayer: false,
      });

      // ------------------------------------------------------
      // If this is a Map Image Layer, add all of its
      // sublayers as well.
      // ------------------------------------------------------
      if (layer.type === "map-image") {
        layer.allSublayers?.forEach((sublayer: any) => {
          registry.push({
            title: sublayer.title,
            type: "sublayer",
            layer: sublayer,
            parent: layer,
            isSublayer: true,
          });
        });
      }
    });

    setLayerRegistry(registry);

    console.log("Complete Layer Registry:", registry);
  }, [jimuMapView]);

  // ============================================================
  // MAP CLICK / IDENTIFY
  // ============================================================

  useEffect(() => {
    if (!jimuMapView?.view) {
      return;
    }

    const view = jimuMapView.view;

    // ----------------------------------------------------------
    // Listen for clicks on the Experience Builder map
    // ----------------------------------------------------------
    const handle = view.on("click", async (event: any) => {
      console.log("Map clicked!");
      console.log("Screen point:", event);

      // ------------------------------------------------------
      // In Experience Builder 1.21, the map component is
      // available from jimuMapView.mapComponent.
      // ------------------------------------------------------
      const mapComponent = jimuMapView.mapComponent;

      if (!mapComponent) {
        console.log("No map component found.");
        return;
      }

      try {
        // ----------------------------------------------------
        // fetchPopupFeatures() returns a Promise containing
        // an AsyncGenerator in ArcGIS Maps SDK 5.1.
        //
        // Therefore we MUST await it first.
        // ----------------------------------------------------
        const graphicGenerator = await mapComponent.fetchPopupFeatures(
          event.screenPoint,
          {
            pointerType: event.pointerType,
          },
        );

        // ----------------------------------------------------
        // Convert the AsyncGenerator into a normal array
        // ----------------------------------------------------
        const graphics: any[] = [];

        for await (const graphic of graphicGenerator) {
          graphics.push(graphic);
        }

        // ----------------------------------------------------
        // Debug output
        // ----------------------------------------------------
        console.log("Popup features found:", graphics.length);

        console.log("Popup graphics:", graphics);

        // ----------------------------------------------------
        // Save the identified graphics so React can render
        // them in the Information panel.
        // ----------------------------------------------------
        setIdentifiedFeatures(graphics);
      } catch (error) {
        console.error("Identify error:", error);
      }
    });

    // ----------------------------------------------------------
    // Remove the click listener when the component is
    // unmounted or jimuMapView changes.
    // ----------------------------------------------------------
    return () => {
      handle.remove();
    };
  }, [jimuMapView]);

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="jimu-widget">
      {/* --------------------------------------------------------
          Connect this widget to the selected Experience Builder
          Map widget.
      --------------------------------------------------------- */}
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}

      {/* --------------------------------------------------------
          Only show the Information panel once the map is ready.
      --------------------------------------------------------- */}
      {jimuMapView?.view && (
        <calcite-panel heading="Information">
          {/* ----------------------------------------------------
              Show how many features were identified.
          ----------------------------------------------------- */}
          <div>Identified features: {identifiedFeatures.length}</div>

          {/* ----------------------------------------------------
              Display each identified feature as its own
              Calcite Block.
          ----------------------------------------------------- */}
          <div>
            {identifiedFeatures.map((graphic, index) => {
              // ------------------------------------------------
              // Determine the title for this feature.
              //
              // Feature Layers:
              //   graphic.layer?.title
              //
              // Map Image Layer sublayers:
              //   graphic.sourceLayer?.title
              //
              // Fallback:
              //   "Feature"
              // ------------------------------------------------
              const title =
                graphic.layer?.title || graphic.sourceLayer?.title || "Feature";

              return (
                <calcite-block
                  key={index}
                  label={title}
                  expanded
                  onClick={() => handleBlockClick(graphic)}
                >
                  <arcgis-feature graphic={graphic}></arcgis-feature>
                </calcite-block>
              );
            })}
          </div>
        </calcite-panel>
      )}
    </div>
  );
};

export default Widget;
