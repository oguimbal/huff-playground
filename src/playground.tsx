import React, { useEffect, useState } from "react";
import { CompilationResult, Editor, HuffResult } from "./editor";
import Success from './Success.svg';
import Loading from './Loading.svg';
import Error from './Error.svg';
import { Btn } from "./Btn";
import Arrow from './Arrow.svg'
import { isHexString  } from "./utils";
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

  useEffect(() => {
    localStorage.setItem("huffcode", code ?? "");
  }, [code]);

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

  return (
    <div className="w-full flex gap-6">
      <div className="flex flex-col p-6 gap-6 w-full rounded-3xl bg-surface">
        <div className="flex flex-col gap-6 h-[60vh]">
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
          <Editor
            code={code ?? ""}
            codeChange={setCode}
            {...props}
            onStatusChange={setStatus}
            error={status.type === 'compilation failed' ? status : null}
          />
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="text-5xl">
            <img
              src={Arrow}
              className={
                status.type.startsWith("decompil") ? "rotate-180" : "rotate-0"
              }
            />
          </span>
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
        <div className='grid grid-cols-2 justify-center items-center gap-2'>
          <div className='text-right'>
            Transaction origin
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
        <div className="flex flex-row justify-center items-center gap-4">
          <Btn
            disabled={!bytecode || !isHexString(from) || !!calldata && !isHexString(calldata) || !net}
            onClick={doSimulate}
            size="small"
          >
            Simulate
          </Btn>
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
