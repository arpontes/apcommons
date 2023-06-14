function Log(logObject: any) {
    const log = { mdmLogObj: logObject };
    console.log(JSON.stringify(log));
    return logObject;
}

function getDiffMs(fromDt: Date) {
    return new Date().getTime() - fromDt.getTime();
}

export type Logger = (result: string, complData?: any, exception?: any) => any;
export function createLogger(action: string, fixedComplData?: any): Logger {
    const dt = new Date();
    return (result: string, complData?: any, exception?: any) =>
        Log({
            action,
            ...(fixedComplData ?? {}),
            result: result == null || result === "" ? undefined : result,
            time: getDiffMs(dt),
            ...(complData ?? {}),
            ...(exception ? { error: true, errorData: JSON.stringify(exception, Object.getOwnPropertyNames(exception)) } : {})
        });
}
export function createLoggerOnLogger(origin: Logger, newFixedComplData: any): Logger {
    return (result: string, complData?: any, exception?: any) => origin(result, { ...(newFixedComplData ?? {}), ...(complData ?? {}) }, exception);
}
