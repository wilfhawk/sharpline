import { buildMockOddsProviderData } from "../mock-data";
import type { OddsProvider, OddsProviderData } from "../odds-provider";

export class MockOddsProvider implements OddsProvider {
  readonly name = "mock";
  readonly isMock = true;

  async fetchData(): Promise<OddsProviderData> {
    return buildMockOddsProviderData();
  }
}
