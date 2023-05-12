import { Module } from "@nestjs/common";
import HealthReporterService from "./health-reporter.service";

@Module({
  imports: [],
  providers: [HealthReporterService],
})
export default class HealthReporterModule {}
