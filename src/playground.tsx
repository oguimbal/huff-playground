import React, { useEffect, useState } from "react";
import { CompilationResult, Editor, HuffResult } from "./editor";
import Success from './Success.svg';
import Loading from './Loading.svg';
import Error from './Error.svg';
import { Btn } from "./Btn";
import Arrow from './Arrow.svg'
import { isHexString, useHash } from "./utils";
import { Simulation, Simulator } from "./Simulator";
import { TextInput } from './TextInput';
import huffLogo from './huff.png';

type DecompilationResult =
  | { type: "decompiling" }
  | { type: "decompiled"; code: string }
  | { type: "decompilation failed"; error: string };

function useAddress() {
  const loc = localStorage.getItem('txOrigin');
  const [from, setFrom] = useState<string>(loc || '0x4242424242424242424242424242424242424242');
  useEffect(() => {
    localStorage.setItem('txOrigin', from);
  }, [from]);
  return [from, setFrom] as const;
}

function useValue() {
  const [value, setValue] = useState<string>(localStorage.getItem('txValue') || '');
  useEffect(() => {
    localStorage.setItem('txValue', value);
  }, [value]);
  return [value, setValue] as const;
}

function useCalldata() {
  const [value, setValue] = useState<string>(localStorage.getItem('txCalldata') || '');
  useEffect(() => {
    localStorage.setItem('txCalldata', value);
  }, [value]);
  return [value, setValue] as const;
}

function useRpc() {
  const [net, setNet] = useState<string>(localStorage.getItem('txRpc') || 'https://polygon-rpc.com');
  useEffect(() => {
    localStorage.setItem('txRpc', net);
  }, [net]);
  return [net, setNet] as const;
}

export function Playground(props: { initialCode?: string }) {
  const [status, setStatus] = useState<CompilationResult | DecompilationResult>(
    { type: "compiling" }
  );
  const [bytecode, setBytecode] = useState<HuffResult | null>(null);
  const [code, setCode] = useState(
    localStorage.getItem("huffcode") ?? props.initialCode
  );
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [calldata, setCalldata] = useCalldata();
  const [from, setFrom] = useAddress();
  const [value, setValue] = useValue();
  const [net, setNet] = useRpc();
  const [depth, setDepth] = useState(1);
  const [shared, setShared] = useState<string | null>(null);
  const [sharedCodeLoaded, setSharedCodeLoaded] = useState<string | null>(null);

  useEffect(() => {
    setShared(null);
    if (code !== sharedCodeLoaded && sharedCodeLoaded) {
      setHash('');
    }
  }, [code]);

  useEffect(() => {
    if (code !== sharedCodeLoaded) {
      localStorage.setItem("huffcode", code ?? "");
    }
  }, [code, sharedCodeLoaded]);

  const [hash, setHash] = useHash();

  useEffect(() => {
    const h = hash && hash.startsWith('#') ? hash.substring(1) : hash;
    console.log('hash', h);
    if (h && !shared) {
      fetch('https://huff-playground-kv.oguimbal.workers.dev/?script=' + h)
        .then(r => r.text())
        .then(txt => {
          setSharedCodeLoaded(txt);
          setCode(txt);
        })
    }
  }, [hash]);

  // when compiled, then update bytecode
  useEffect(() => {
    if (status.type === "compiled") {
      setBytecode(status.result);
    }
  }, [status]);

  const doSimulate = () => {
    let cd = calldata || '0x';
    let val = value || '0x';
    if (!bytecode
      || !from
      || !isHexString(from)
      || !isHexString(cd)
      || !isHexString(val)) {
      return;
    }
    setSimulation({
      sim: bytecode,
      from,
      value: val,
      calldata: cd,
      depth,
    });
  };

  const doShare = async () => {
    console.log('sharing', code);
    const r = await fetch('https://huff-playground-kv.oguimbal.workers.dev/', {
      method: 'POST',
      body: code,
    })

    if (!r.ok) {
      setShared('error');
      return;
    }

    const hash = await r.text();

    setHash(hash);

    const txt = window.location.toString();
    navigator.clipboard.writeText(txt);
    setShared(txt);
  };

  return (
    <div className="w-full flex gap-6">
      <div className="flex flex-col p-6 gap-6 w-full rounded-3xl bg-surface">
        <div className="flex flex-col gap-6">
          <div className="text-xl font-youth font-medium">
            <img src={huffLogo} className='h-8 inline-block' />
            <a href="https://huff.sh/" className='underline' target='_blank'>
              Huff
            </a>
            &nbsp;
            Playground

            <a href='https://www.evm.codes/'
              target='_blank'
              className='float-right text-sm underline'>
              EVM codes reference
            </a>
          </div>

          <div className="flex flex-row">
            <div className="flex-grow h-[60vh]">
              <Editor
                code={code ?? ""}
                codeChange={setCode}
                {...props}
                onStatusChange={setStatus}
                error={status.type === 'compilation failed' ? status : null}
              />
            </div>
            <div className="w-[600px]">
              <div className="flex items-center gap-2 justify-center mb-4 mx-2">
                <div
                  className={`flex p-3 rounded-xl items-center gap-1.5 bg-surface-muted text-base font-medium ${status.type.includes("compiling")
                    ? "text-accent"
                    : status.type.includes("failed")
                      ? "text-error"
                      : "text-success"
                    }`}
                >
                  {status.type === "compiling" && (
                    <>
                      <img src={Loading} className="w-4 h-4 animate-spin" /> Compiling
                    </>
                  )}
                  {status.type === "compiled" && (
                    <>
                      <img src={Success} /> Compiled
                    </>
                  )}
                  {status.type === "compilation failed" && (
                    <>
                      <img src={Error} /> Compilation failed: {status.error}
                    </>
                  )}
                  {status.type === "decompiling" && (
                    <>
                      <img src={Loading} className="w-4 h-4 animate-spin" />{" "}
                      Decompiling
                    </>
                  )}
                  {status.type === "decompiled" && (
                    <>
                      <img src={Success} /> Decompiled
                    </>
                  )}
                  {status.type === "decompilation failed" && (
                    <>
                      <img src={Error} /> Decompilation failed: {status.error}
                    </>
                  )}
                </div>
              </div>
              <div className='grid grid-cols-[auto_auto] grid-template-columns: auto auto justify-center items-center gap-2'>
                <div className='text-right'>
                  Origin
                </div>
                <TextInput
                  className='w-[470px]'
                  placeholder='Transaction origin address'
                  value={from}
                  onChange={v => setFrom(v.target.value)} />
                <div className='text-right'>
                  Calldata
                </div>
                <TextInput
                  className='w-[470px]'
                  placeholder='Calldata (0x...)'
                  value={calldata}
                  onChange={v => setCalldata(v.target.value)} />
                <div className='text-right'>
                  Value
                </div>
                <TextInput
                  className='w-[470px]'
                  placeholder='Value (0x...)'
                  value={value}
                  onChange={e => setValue(e.target.value)} />
                <div className='text-right'>
                  Network RPC
                </div>
                <TextInput
                  className='w-[470px]'
                  placeholder='Network RPC (https://...)'
                  value={net}
                  onChange={e => setNet(e.target.value)}
                />
                {/* <div className='text-right'>
            Log depth (min 1)
          </div>
          <TextInput
            inputType='number'
            className='w-[470px]'
            placeholder='Depth'
            value={depth}
            onChange={e => {
              let i = parseInt(e.target.value);
              if (!Number.isFinite(i) || i < 1) {
                i = 1;
              }
              setDepth(i);
            }}
          /> */}
              </div>
              <div className="flex flex-row justify-center items-center gap-4 my-4">
                <Btn
                  disabled={!bytecode || !isHexString(from) || !!calldata && !isHexString(calldata) || !net}
                  onClick={doSimulate}
                  size="small"
                >
                  Simulate
                </Btn>
                <Btn
                  onClick={doShare}
                  size="small"
                >
                  Share
                </Btn>
              </div>
              {
                shared && (
                  <div className="text-center m-4">
                    {
                      shared === 'error' ? <div className="text-red">Sharing failed</div> : (
                        <>
                          <div className='text-sm'>Copied to clipboard:</div>
                          <div className='m-2'>{shared}</div>
                        </>
                      )
                    }
                  </div>
                )
              }
            </div>
          </div>
        </div>


        {simulation && (
          <>
            <Simulator tx={simulation} rpc={net} />
          </>
        )}
      </div>
    </div>
  );

}
