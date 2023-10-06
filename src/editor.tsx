import React, { FC, useEffect, useState } from 'react';
import MonacoEditor, { MonacoEditorProps } from 'react-monaco-editor';
import dedent from 'dedent'
import type * as monaco from 'monaco-editor';
import _package from './Package.svg';
import _function from './Function.svg';
import { nil, useElementSize } from './utils';

interface PlaygroundProps {
  code: string;
  codeChange: (code: string) => any;
  onStatusChange?: (result: CompilationResult) => any;
  error: ErrorDef | nil;
}

export interface HuffResult {
  abi: any;
  bytecode: string;
  runtime: string;
}

export type CompilationResult =
  | { type: 'compiling' }
  | { type: 'compiled'; result: HuffResult; }
  | { type: 'compilation failed'; } & ErrorDef;

export interface ErrorDef {
  error: string;
  position?: CodePosition
}
export interface CodePosition {
  from: number;
  to: number;
}

export function Editor(props: PlaygroundProps) {
  const [ref, { height }] = useElementSize();

  // typescript is wrong...
  const EE = EEditor as unknown as FC<PlaygroundProps & { height: number }>;
  return (
    <div className="h-full w-full" ref={ref}>
      <EE {...props} height={height} />
    </div>
  );
}

interface State {
}
type CP = PlaygroundProps & { height: number; };
class EEditor extends React.Component<PlaygroundProps & { height: number; }, State> {
  private editor?: monaco.editor.ICodeEditor;
  private monaco?: typeof monaco;
  private timeout: any;
  private code: string;
  constructor(props: CP) {
    super(props);
    this.state = { status: 'compiling' }
    // swap0x($USDT, 1000000, $USDC, 3%);
    this.code = props.code || dedent`#define macro MAIN() = {
      // This is an example, which fetches WMATIC balance of a holder
      // nb: This must execute on Polygon network


      // === store args at 0
      0x70a08231 // balanceOf(address) sig
      0x0 mstore

      0x6d80113e533a2c0fe82eabd35f1875dcea89ea97 // random WMATIC holder
      0x4 mstore

      // == push static call args
      // ret span
      0x20 0x0
      // arg span
      0x24 0x0

      // WMATIC address
      0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270
      gas

      // == perform call & push balance on stack if success
      staticcall
      success jumpi
      0x0 0x0 revert
      success:
      0x0 mload
    }`;
  }
  editorDidMount(editor: monaco.editor.ICodeEditor, m: typeof monaco) {
    this.editor = editor;
    this.monaco = m;
    editor.focus();
    this.compile(this.code);
  }

  onChange(newValue: string) {
    if (newValue === this.code) {
      return;
    }
    this.code = newValue;
    this.props.codeChange(newValue);
    this.recompile();
  }

  componentWillReceiveProps(newProps: CP) {
    if (newProps.code !== this.code && newProps.code) {
      this.code = newProps.code;
      this.editor?.getModel()?.setValue(newProps.code);
    }

    this.updateError(newProps.error);
  }

  private updateError(e: ErrorDef | nil) {
    const model = this.editor?.getModel()!;
    const value = model.getValue();
    function computeColAndLine(pos: number) {
      let line = 1;
      let col = 1;
      for (let i = 0; i < pos; i++) {
        if (value[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
      }
      return { line, col };
    }
    const from = computeColAndLine(e?.position?.from ?? 0);
    const to = computeColAndLine(e?.position?.to ?? 0);
    this.monaco?.editor?.setModelMarkers(
      model,
      'playground',

      e?.position ? [
        {
          startColumn: from.col,
          endColumn: to.col,
          startLineNumber: from.line,
          endLineNumber: to.line,
          message: e.error,
          severity: this.monaco.MarkerSeverity.Error,
        }
      ] : []
    );
  }


  recompile() {
    clearTimeout(this.timeout);
    this.setState({
      ...this.state,
      globalError: null,
      status: 'compiling',
      bytecode: null,
      resultType: null,
    });
    this.timeout = setTimeout(() => this.compile(this.code), 300);
  }


  async compile(code: string) {
    this.props.onStatusChange?.({ type: 'compiling' });
    try {
      const { compile } = await import('huffc-js');

      const files = {
        'main.huff': code,
      };
      const raw = compile({
        files,
        sources: ['main.huff'],
      });

      const result = raw.contracts?.get?.('main.huff');
      if (!result) {
        throw new Error('Compilation failed');
      }
      if (code !== this.code) {
        // concurrency
        return;
      }
      this.props.onStatusChange?.({ type: 'compiled', result });
    } catch (_e) {
      const e = _e as any;
      let msg: string | null = null;
      let position: CodePosition | undefined = undefined;
      if (e && typeof e === 'object') {
        if (Array.isArray((e as any).errors)) {
          msg = (e as any).errors[0];
          const [, realmsg, from, to] = /^(.*)->\s*main\.huff:(\d+)-(\d+)/sg.exec(msg ?? '') ?? [];
          msg = realmsg?.trim() ?? msg;
          position = from && to ? {
            from: parseInt(from),
            to: parseInt(to),
          } : undefined;
        }
      }
      this.props.onStatusChange?.({
        type: 'compilation failed',
        error: msg ?? e?.toString?.() ?? 'Unknown error',
        position,
      });
    }
  }

  render() {
    const options = {
      selectOnLineNumbers: true,
      glyphMargin: true,
    };
    // typescript is wrong...
    const ME = MonacoEditor as unknown as FC<MonacoEditorProps>;
    return <div className='rounded-2xl p-3 bg-[#1e1e1e]'>
      <ME
        width="100%"
        height={this.props.height - 24}
        language="sol"
        theme="vs-dark"
        value={this.code}
        options={options}
        onChange={this.onChange.bind(this)}
        editorDidMount={this.editorDidMount.bind(this)}
      />
    </div>
  }
}
