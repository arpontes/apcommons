import { Logger } from "./logging";

type PossibleReturn = {
    stop?: boolean;
    error?: boolean;
};
export async function processBatch<T, K extends PossibleReturn, Y>(
    readData: Array<T>, 
    batchSize: number, 
    logger: Logger, 
    fnProcessData: (item: T, logger: Logger) => Promise<K>, 
    fnProcessBlock?: (successItems: Array<Y>, errorItems: Array<K>, logger: Logger) => Promise
) {
    const mustProcessBlocks = fnProcessBlock != null;
    const processData = { threads: [] as Array<Promise<K>>, totalProcessed: 0, totalErrors: 0, successes: [] as Y[], errors: [] as K[] };
    for await (const obj of readData) {
        processData.threads.push(fnProcessData(obj, logger));
        if (processData.threads.length === batchSize) {
            const shouldContinue = await processBlock(processData, logger);
            if (!shouldContinue) break;
        }
    }
    if (processData.threads.length > 0) await processBlock(processData, logger);
    return { totalProcessed: processData.totalProcessed, totalErrors: processData.totalErrors, errors: processData.errors };

    async function processBlock() {
        const msgs = await Promise.all(processData.threads);
    
        processData.threads = [];
        let shouldContinue = true;
        for (var j = 0; j < msgs.length; j++) {
            processData.totalProcessed++;
            const retData = msgs[j];
            if (retData?.stop) shouldContinue = false;
            if (retData?.error === true) {
                processData.totalErrors++;
                processData.errors.push(retData);
            } else if (mustProcessBlocks) {
                processData.successes.push(retData);
            }
            logger("", retData);
        }
        if (mustProcessBlocks){
            await fnProcessBlock(processData.successes, processData.errors, logger);
            processData.totalProcessed = processData.totalErrors = 0;
            processData.successes = [];
            processData.errors = [];
        }
        return shouldContinue;
    }
}
