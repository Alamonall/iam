import { Controller, Get } from "@nestjs/common";
import ServiceRouterService from "./service-router.service";

@Controller()
export default class ServiceRouterController {
  constructor(private readonly serviceRouter: ServiceRouterService) {}

  @Get("/healthz")
  async healthz(): Promise<{ status: "OK" }> {
    return this.serviceRouter.healthz();
  }

  @SpecHandler("adm_iam_dashboard_definition")
  async admDashboardDefinition(): Promise<
    ResponseWithOptionalTracking<AdmDashboardDefinitionResponse>
  > {
    const response = this.serviceRouter.admDashboardDefinition();
    return {
      status: "OK",
      dashboard_definition: response,
    };
  }
}
