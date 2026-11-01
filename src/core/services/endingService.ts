import { useEndingStore } from '@core/stores/endingStore';
import type { EndingId } from '@core/stores/endingStore';
import { useUiStore } from '@core/stores/uiStore';

export function triggerEnding(id: EndingId): void {
  useEndingStore.setState({ ending: id });
  useUiStore.getState().setScene('ending');
}