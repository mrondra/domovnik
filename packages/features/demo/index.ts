import './registry.generated';
export { DemoModule } from './api/demo.module';
export { DemoService, listScenarios, registerScenario, runScenario } from './service/index';
export { defineDemoReset, defineScenarioKind } from './domain/definition';
export { demoToday } from './domain/today';

export type { DemoResetDefinition, ScenarioKindDefinition } from './domain/definition';
export type { Scenario, ScenarioResult } from './domain/types';
