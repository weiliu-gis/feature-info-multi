# Feature Info Multi

**Feature Info Multi** is a custom widget for **ArcGIS Experience Builder Developer Edition 1.21**. It displays information for multiple features found through map clicks or Search widget results, organizes them by layer(group), and provides controls for navigating and highlighting features.

![Feature Info Multi Interface](screenshot.png)

_Note: The screenshot is for demonstration purposes only. The widget's appearance and displayed information may vary depending on the application configuration and map data._

## Features

- **Identify multiple features:** Click the connected map to retrieve popup information from supported, visible, popup-enabled layers. A red pin marks the selected location.
- **Search integration:** Use results from Search widget to find and display feature information at the selected location. For lines or polygons, an interior point is used.
- **Grouped results:** Organizes features under their highest-level layer or group name, with individual feature details displayed in the blocks.
- **Expand and collapse:** Open or close individual result groups, or use the panel action to expand or collapse all groups at once.
- **Feature selection:** Enable selection to click a feature block, zoom to its geometry, and highlight it in cyan. Click the same block again to deselect it.
- **Clear results:** Remove the displayed results, location pin, selection highlight, and search-location notice.

The panel displays the number of returned features and shows its action buttons when results are available.

## Requirements

- ArcGIS Experience Builder Developer Edition **1.21**.
- An Experience Builder **Map** widget with a web map containing accessible, popup-enabled layers.
- An Experience Builder **Search** widget if search-result integration is needed.

The widget works with popup results returned by the connected Map widget, including results from supported Feature Layers and Map Image Layers.

## Installation

1. Download or clone this repository.
2. Place the `feature-info-multi` folder in your Experience Builder installation:

   ```text
   client/your-extensions/widgets/
   ```

3. Start the Experience Builder Developer Edition server and client. If the client was already running when you added the widget, restart it.
4. Open your experience and add **Feature Info Multi** from the custom widgets.

## Widget settings

### Connect a Map widget (required)

1. Add a **Map** widget to your experience and configure its web map.
2. Select **Feature Info Multi** to open its settings.
3. Under **Select a Map widget**, choose the Map widget to connect.

Select **one** Map widget. Make sure the layers you want to identify are visible, accessible, and configured to display popups.

### Connect a Search widget (optional)

To display feature information when users select Search results:

1. Add and configure a **Search** widget.
2. In the Search widget's settings, open **Action** and add a **Message action** trigger.
3. Choose **Record selection changes** as the trigger.
4. Select **Feature Info Multi** as the target widget and **Search result** as the action.
5. Save your settings.

The **Search result** action requires no additional configuration. Map-click identification works without this integration.

## Using the widget

| Control or interaction         | What it does                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Click the map                  | Shows popup information for features found near the clicked location.        |
| Select a Search result         | Shows feature information at the selected point or polygon's interior point. |
| Expand/Collapse All            | Opens or closes all result groups.                                           |
| Block section heading          | Expands or collapses an individual group.                                    |
| Enable selection               | Allows feature blocks to be clicked for zooming and highlighting.            |
| Click a selected feature again | Removes its highlight.                                                       |
| Disable selection              | Turns off feature-block selection and clears the current highlight.          |
| Delete all results             | Clears the results, map pin, highlight, and search-location notice.          |

The header controls appear when at least one feature is found. Selection is disabled by default.

## Notes and limitations

- Results depend on the map's popup configuration, layer visibility, and service permissions.
- Search results provide a location for retrieving popup information; the widget does not simply reproduce the original Search record.
- Results are grouped by their highest-level layer **title**. Layers with identical top-level titles may share a group.
- The widget temporarily hides the map view's default highlight by setting its fill color and border color to transparent.
- Custom section-header spacing relies on Calcite's internal styling and should be checked after upgrading Experience Builder or Calcite.

## Deployment

To test the widget in an application, publish and download the **entire** Experience Builder application. Extract it and copy the application files to your web server(folder). The custom widget is included in the downloaded experience.

If your experience uses private ArcGIS content, register the deployed application and configure its client ID according to Esri's Experience Builder deployment instructions. Users still need permission to access secured maps and services.

## Documentation

- [ArcGIS Experience Builder: Custom widget development](https://developers.arcgis.com/experience-builder/guide/getting-started-widget/)
- [ArcGIS Experience Builder: Actions](https://developers.arcgis.com/experience-builder/guide/action-triggers/)
- [ArcGIS Experience Builder: Deployment](https://developers.arcgis.com/experience-builder/guide/experience-deployment/)
- [Calcite Design System](https://developers.arcgis.com/calcite-design-system/)
- [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/)
