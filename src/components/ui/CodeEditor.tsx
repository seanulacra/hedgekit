'use client'

import React, { useRef, useEffect } from 'react'
import { EditorView, keymap, highlightActiveLine, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion, completionKeymap, closeBrackets } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { basicSetup } from 'codemirror'

interface CodeEditorProps {
  code: string
  language?: 'javascript' | 'typescript' | 'jsx' | 'tsx'
  theme?: 'light' | 'dark'
  readOnly?: boolean
  onChange?: (code: string) => void
  className?: string
}

export function CodeEditor({
  code,
  language = 'jsx',
  theme = 'dark',
  readOnly = true,
  onChange,
  className = ''
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const extensions = [
      basicSetup,
      javascript({ jsx: true, typescript: language.includes('ts') }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange && !readOnly) {
          onChange(update.state.doc.toString())
        }
      }),
      EditorState.readOnly.of(readOnly)
    ]

    if (theme === 'dark') {
      extensions.push(oneDark)
    }

    const startState = EditorState.create({
      doc: code,
      extensions
    })

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== code) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: code
        }
      })
    }
  }, [code])

  return (
    <div className={`overflow-hidden rounded-md border ${className}`}>
      <div ref={editorRef} className="min-h-[100px]" />
    </div>
  )
}