/** The one place the demo reads the clock; everything else takes the date it is handed. */
export function demoToday(): Date {
  return new Date();
}
