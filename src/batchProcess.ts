import { Logger } from "./logging";

export default async function processBatch<T>(readData: Array<T>, batchSize: number, logger: Logger, fnProcessData: (item: T, logger: Logger) => Promise<any>) {
    const processData = { threads: [] as Array<Promise<any>>, totalProcessed: 0, errors: [] };
    for await (const obj of readData) {
        processData.threads.push(fnProcessData(obj, logger));
        if (processData.threads.length === batchSize) {
            const shouldContinue = await processBlock(processData, logger);
            if (!shouldContinue) break;
        }
    }
    if (processData.threads.length > 0) await processBlock(processData, logger);
    return { totalProcessed: processData.totalProcessed, errors: processData.errors };
}
async function processBlock(processData: { threads: Array<Promise<any>>; totalProcessed: number; errors: any[] }, logger: Logger) {
    const msgs = await Promise.all(processData.threads);

    processData.threads = [];
    let shouldContinue = true;
    for (var j = 0; j < msgs.length; j++) {
        processData.totalProcessed++;
        const retData = msgs[j];
        if (retData?.stop) {
            shouldContinue = false;
            continue;
        }
        if (retData?.error === true) processData.errors.push(retData);
        logger("", retData);
    }
    return shouldContinue;
}
