// Shared editor document types
export type EditorBlock = {
  type: string
  // content can be a simple string, an array of inline fragments, or nested structure used by the editor
  content?: string | Array<{ text?: string }> | unknown
  [key: string]: unknown
}

export type EditorDocument = EditorBlock[]

export default EditorDocument
