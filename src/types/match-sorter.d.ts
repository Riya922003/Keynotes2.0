declare module 'match-sorter' {
  export interface MatchSorterOptions<T> {
    keys?: Array<string | ((item: T) => string)>
  }

  export function matchSorter<T>(items: T[], search: string, options?: MatchSorterOptions<T>): T[]
  const matchSorterDefault: <T>(items: T[], search: string, options?: MatchSorterOptions<T>) => T[]
  export default matchSorterDefault
}
