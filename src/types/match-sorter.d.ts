declare module 'match-sorter' {
  export function matchSorter<T>(items: T[], search: string, options?: any): T[]
  export default matchSorter
}
