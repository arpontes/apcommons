import { Logger } from "./logging";

export type ReturnSuccess = {
    stop?: boolean;
    error?: false;
};
export type ReturnError = {
    stop?: boolean;
    error: true;
};
export async function processBatch<T, K extends ReturnSuccess, E extends ReturnError>(
    readData: Array<T>,
    batchSize: number,
    logger: Logger,
    fnProcessData: (item: T, logger: Logger) => Promise<K | E>,
    fnProcessBlock?: (totalProcesses: number, successItems: Array<K>, errorItems: Array<E>) => Promise<void>
) {
    const mustProcessBlocks = fnProcessBlock != null;
    const processData = { threads: [] as Array<Promise<K | E>>, totalProcessed: 0, totalErrors: 0, errors: [] as E[] };
    for await (const obj of readData) {
        processData.threads.push(fnProcessData(obj, logger));
        if (processData.threads.length === batchSize) {
            const shouldContinue = await processBlock();
            if (!shouldContinue) break;
        }
    }
    if (processData.threads.length > 0) await processBlock();
    return { totalProcessed: processData.totalProcessed, totalErrors: processData.totalErrors, errors: processData.errors };

    async function processBlock() {
        const msgs = await Promise.all(processData.threads);

        processData.threads = [];
        processData.totalProcessed += msgs.length;

        let shouldContinue = true;
        const blockResult = { successes: [] as K[], errors: [] as E[] };
        for (var j = 0; j < msgs.length; j++) {
            const retData = msgs[j];

            const hasError = retData?.error === true;
            if (hasError) {
                processData.totalErrors++;
                processData.errors.push(retData);
            }

            if (mustProcessBlocks) {
                if (hasError) blockResult.errors.push(retData);
                else blockResult.successes.push(retData);
            }

            if (retData?.stop) shouldContinue = false;
        }
        if (mustProcessBlocks) await fnProcessBlock(processData.totalProcessed, blockResult.successes, blockResult.errors);
        return shouldContinue;
    }
}
