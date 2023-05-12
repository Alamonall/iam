import { Injectable } from "@nestjs/common";
import dashboardDefinition from "./dashboard/dashboardDefinition";

@Injectable()
export default class ServiceRouterService {
  async healthz(): Promise<{ status: "OK" }> {
    return {
      status: "OK",
    };
  }

  admDashboardDefinition(): ResponseWithOptionalTracking<DashboardDefinition> {
    return dashboardDefinition;
  }
}
