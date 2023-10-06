import { useEffect, useState } from 'react';
import { IExecutor, newSession } from 'evm-js-emulator';
import { toUint, parseBuffer, MAX_UINT, to0xAddress } from 'evm-js-emulator/src/utils';
import { execWatchInstructions, } from "evm-js-emulator/tests/test-utils";
import { HexString } from './utils';
import { Spinner } from './Spinner';
import { HuffResult } from './editor';
export interface Simulation {
    sim: HuffResult;
    from: HexString;
    value: HexString;
    calldata: HexString;
    depth: number;
}

interface RawOp {
    type: 'op';
    opname: string;
    eaten: string[];
    newStack: string[];
}
type Op = RawOp | {
    type: 'subcall';
    ops: Op[];
    to: HexString;
}


export type SimulationResult =
    | {
        type: 'ok';
    }
    | {
        type: 'error';
        error: string;
    }
    | { type: 'loading'; }



export function Simulator({ tx, rpc }: { tx: Simulation; rpc: string }) {

    const [simResult, setSimResult] = useState<SimulationResult>({ type: 'loading' });
    const [ops, setOps] = useState<Op[]>([]);

    const setResult = (result: SimulationResult) => {
        setSimResult(result);
    }

    useEffect(() => {
        setSimResult({ type: 'loading' });

        (async () => {


            setOps([]);
            let contract: HexString | null = null;
            const ops: Op[] = [];
            try {
                const session = newSession({
                    rpcUrl: rpc,
                });

                const addr = session.deployRaw(tx.sim.runtime);
                contract = to0xAddress(addr);
                // execute transaction
                const exec = await session.prepareCall({
                    origin: toUint(tx.from),
                    callvalue: toUint(tx.value),
                    calldata: parseBuffer(tx.calldata),
                    contract: addr,
                    gasLimit: MAX_UINT,
                    gasPrice: toUint(0xffff),
                    retdatasize: 0,
                    static: false,
                    timestamp: Date.now() / 1000,
                });
                // watch all logs emitted that might interest us, and accumulate them in "allEvents"
                // watch(allEvents, exec);
                watch(exec, ops, tx.depth);

                // this will execute the tx, and log execution in console.

                await execWatchInstructions(exec, 5) ?? [];

                setResult({ type: 'ok', });

            } catch (e) {
                console.error('Failed simulation', e);
                try {
                    setResult({
                        type: 'error',
                        error: (e as any).message,
                    })
                } catch (e2) {
                    console.error('Failed to infer logs of errored simulation', e2);
                    setResult({
                        type: 'error',
                        error: (e as any).message,
                    })
                }
            } finally {
                setOps(ops);
            }
        })();

    }, [tx])

    if (simResult.type === 'loading') {
        return <div className="text-center">
            <Spinner /> Simulating...
        </div>
    }


    return <div>
        <div className='m-5'>
            <table className='ml-5'>
                {
                    ops
                        .filter((x): x is RawOp => x.type === 'op')
                        .map((r, i) => <tr key={i}>
                            <td className='px-2'><b>{r.opname}</b></td>
                            <td className='px-2'>
                                {r.eaten.join(', ').replace('➡', '👉')}
                            </td>
                            <td className='px-2'>
                                📚 [{r.newStack.join(', ')}]
                            </td>
                        </tr>)
                    // simResult.contractEvents.map((r, i) => <li key={i}>{r.type === 'erc20Transfer' ? <EvtTransfer r={r} /> : <EvtLog l={r} tokens={simResult.tokensByAddress} />}</li>)
                }

            </table>
        </div>
        {
            simResult.type === 'error' ? <div className="text-center">
                ❌ Simulation error: {simResult.error}
            </div> : <div className='text-lg text-center'>
                ✅ Simulation success
            </div>
        }
    </div>;
}

function watch(exec: IExecutor
    , ops: Op[]
    , depth: number
) {
    if (!depth) {
        return;
    }
    exec.watch((_, __, nm, eaten, seq) => {
        const opname = nm.substring('op_'.length);
        ops.push({ type: 'op', opname, eaten, newStack: exec.dumpStack() });
    });
    exec.onStartingCall((newExec) => {
        const subops: Op[] = [];
        ops.push({
            type: 'subcall',
            ops: subops,
            to: to0xAddress(newExec.contractAddress),
        })
        watch(newExec, subops, depth - 1);
    });
    // exec.onEndingCall((_, __, success) => {
    //     // do something ?
    // });
    // exec.onLog(_log => {
    //     // do something ?
    // });
}
