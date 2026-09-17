import {
  AbstractMessageAction,
  MessageType,
  MutableStoreManager,
} from "jimu-core"

import type {
  DataRecordsSelectionChangeMessage,
  Message,
  MessageDescription,
} from "jimu-core"

import * as labelPointOperator from "@arcgis/core/geometry/operators/labelPointOperator.js"

export default class SearchResultAction extends AbstractMessageAction {
  filterMessageDescription(
    messageDescription: MessageDescription,
  ): boolean {
    return (
      messageDescription.messageType ===
      MessageType.DataRecordsSelectionChange
    )
  }

  filterMessage(message: Message): boolean {
    return true
  }

  getSettingComponentUri(
    messageType: MessageType,
    messageWidgetId?: string,
  ): string {
    return "actions/search-result-action-setting"
  }

  onExecute(message: Message): Promise<boolean> | boolean {
    const selectionMessage =
      message as DataRecordsSelectionChangeMessage

    if (!selectionMessage.records?.length) {
      return true
    }

    const record = selectionMessage.records[0]
    const geometry = record.feature?.geometry

    if (!geometry) {
      return true
    }

    let searchPoint

    // Convert parcel polygons to an interior point
    if (geometry.type === "polygon") {
      searchPoint = labelPointOperator.execute(geometry)
    }

    // Locator results are already points
    if (geometry.type === "point") {
      searchPoint = geometry
    }

    if (searchPoint) {
      MutableStoreManager.getInstance().updateStateValue(
        this.widgetId,
        "searchPoint",
        searchPoint,
      )
    }

    return true
  }
}