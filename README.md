# Advanced Feature Info

**Advanced Feature Info** is a custom widget for **ArcGIS Experience Builder Developer Edition 1.21**. It displays popup information for multiple features identified through map clicks or selections from other Experience Builder widgets. Results are organized by layer, with controls for navigating and highlighting features.

![Advanced Feature Info Interface](https://github.com/user-attachments/assets/59aad9e0-6aae-4967-a2c5-d57ce32e8e00)

_Note: The screenshot is for demonstration purposes only. Appearance and results depend on the application and map configuration._

## Features

- **Identify multiple features:** Click the connected map to retrieve popup information from visible, popup-enabled layers. A red pin marks the clicked location.
- **Widget integration:** Retrieve intersecting features using selected geometries from **Search, Query, Table, List, Select**, and other compatible widgets through a single message action.
- **Geometry handling:** Supports point, line, and polygon inputs, including point tolerance (when configured), inward polygon buffering, multiple selections, and duplicate removal.
- **Grouped results:** Organizes features under their highest-level layer or group name.
- **Expand and collapse:** Open or close individual groups or all groups at once.
- **Feature selection:** Click a feature block to zoom to and highlight its geometry; click again to deselect.
- **Clear results:** Remove displayed results and map graphics.

## Requirements

- ArcGIS Experience Builder Developer Edition **1.21**.
- A **Map** widget with an accessible web map and popup-enabled layers.
- Optional source widgets that support **Record selection changes** and provide records with usable geometry.

## Installation

1. Download or clone this repository.
2. Place the `feature-info-multi` folder in:

   ```text
   client/your-extensions/widgets/
   ```

3. Start or restart Experience Builder Developer Edition.
4. Add **Advanced Feature Info** to your experience.

_When upgrading, replace the existing widget folder cleanly so obsolete files are not retained._

## Widget settings

### Connect a Map widget (required)

1. Add a **Map** widget and configure its web map.
2. Open **Advanced Feature Info** settings.
3. Under **Select a Map widget**, choose the Map widget to connect.

### Connect other widgets (optional)

1. Add and configure a compatible widget, such as **Search**, **Query**, or **Table**.
2. In its settings, open **Action → Message action**.
3. Choose **Record selection changes** as the trigger.
4. Select **Advanced Feature Info → Show Feature Information** as the action.

Repeat for additional source widgets. No action-specific settings are required. Map-click identification works without message-action configuration.

## Using the widget

| Control or interaction                | What it does                                                      |
| ------------------------------------- | ----------------------------------------------------------------- |
| Click the map                         | Retrieves popup information near the clicked location.            |
| Select a record in a connected widget | Retrieves features intersecting the selected geometry.            |
| Expand/Collapse All                   | Opens or closes all result groups.                                |
| Group heading                         | Expands or collapses an individual group.                         |
| Enable selection                      | Allows feature blocks to be clicked for zooming and highlighting. |
| Click a selected feature again        | Removes its highlight.                                            |
| Delete all results                    | Clears results and related map graphics.                          |

## Notes and limitations

- Results depend on layer visibility, popup configuration, and service permissions.
- **Map Click** uses a screen-based hit tolerance; external point selections use spatial intersection with any configured ground-distance tolerance.
- Locator-based Search results may not coincide exactly with stored feature locations.
- Results are grouped by the highest-level layer title; layers sharing that title may appear together.
- The widget temporarily suppresses the map's default highlight. Custom Calcite styling may require review after upgrades.

## Deployment

Publish and download the **entire Experience Builder application**, then deploy its files to your web server. The custom widget is included in the downloaded application. Private ArcGIS content may require application registration and appropriate user permissions.

## Documentation

- [ArcGIS Experience Builder: Custom widget development](https://developers.arcgis.com/experience-builder/guide/getting-started-widget/)
- [ArcGIS Experience Builder: Actions](https://developers.arcgis.com/experience-builder/guide/action-triggers/)
- [ArcGIS Experience Builder: Deployment](https://developers.arcgis.com/experience-builder/guide/experience-deployment/)
- [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/)
