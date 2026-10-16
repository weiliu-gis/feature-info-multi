import {
  AbstractMessageAction,
  MessageType,
  MutableStoreManager,
  type DataRecord,
  type DataRecordsSelectionChangeMessage,
  type Message,
  type MessageDescription,
} from "jimu-core";

import type Geometry from "@arcgis/core/geometry/Geometry.js";
import { fromJSON as geometryFromJSON } from "@arcgis/core/geometry/support/jsonUtils.js";
import type { WidgetSelectionInput } from "../runtime/types";

// Convert selected records to ArcGIS Maps SDK geometries regardless of source widget.
const getRecordGeometry = (record: DataRecord): Geometry | null => {
  const raw = (record as any).feature?.geometry ?? record.getGeometry();
  if (!raw) return null;

  if (typeof raw.type === "string" && typeof raw.toJSON === "function") {
    return raw as Geometry;
  }

  const json =
    typeof raw.toJS === "function"
      ? raw.toJS()
      : typeof raw.toJSON === "function"
        ? raw.toJSON()
        : raw;

  try {
    return geometryFromJSON(json);
  } catch (error) {
    console.warn("[Feature Info Multi] Unsupported selection geometry:", error);
    return null;
  }
};

export default class UnifiedSelectionAction extends AbstractMessageAction {
  filterMessageDescription(description: MessageDescription): boolean {
    return description.messageType === MessageType.DataRecordsSelectionChange;
  }

  filterMessage(message: Message): boolean {
    return message.type === MessageType.DataRecordsSelectionChange;
  }

  // No action settings: all external widgets use spatial intersection.
  getSettingComponentUri() {
    return null;
  }

  onExecute(message: Message): boolean {
    if (message.type !== MessageType.DataRecordsSelectionChange) return false;

    const selection = message as DataRecordsSelectionChangeMessage;
    const sourceId = `${selection.widgetId ?? "data"}:${selection.dataSourceId ?? "records"}`;
    const records = selection.records ?? [];
    const store = MutableStoreManager.getInstance();

    if (records.length === 0) {
      const input: WidgetSelectionInput = { kind: "clear", sourceId };
      store.updateStateValue(this.widgetId, "widgetInput", input);
      return true;
    }

    const geometries = records
      .map(getRecordGeometry)
      .filter((geometry): geometry is Geometry => geometry !== null);

    // Don't silently query only part of a multi-feature selection.
    if (geometries.length !== records.length) {
      console.warn(
        "[Advanced Feature Info] Selected records are missing geometries",
      );
      return false;
    }

    const input: WidgetSelectionInput = {
      kind: "selection",
      sourceId,
      geometries,
    };
    store.updateStateValue(this.widgetId, "widgetInput", input);
    return true;
  }
}
