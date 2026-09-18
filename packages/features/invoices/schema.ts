// `packages/db` composes the migration schema from the `schema.ts` of every feature, and its glob
// does not look inside a directory — so the tables live one level down and this file is what it
// finds (task 014).
export * from './schema/index';
