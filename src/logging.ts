function defaultLog<T>(logObject: T) {
    console.log(JSON.stringify(logObject));
    return logObject;
}

function getDiffMs(fromDt: Date) {
    return new Date().getTime() - fromDt.getTime();
}

export type Logger = <T>(result: string, complData?: T, exception?: any) => { action: string; result?: string; time: number; error?: true; errorData?: string } & T;
export function createLogger(action: string, fixedComplData?: any, fnLogAction: <T>(logObject: T) => T: Logger {
    const dt = new Date();
    const action = fnLogAction ? fnLogAction : defaultLog;
    return (result: string, complData?: any, exception?: any) =>
        action(
            {
                action,
                ...(fixedComplData ?? {}),
                result: result == null || result === "" ? undefined : result,
                time: getDiffMs(dt),
                ...(complData ?? {}),
                ...(exception ? { error: true, errorData: JSON.stringify(exception, Object.getOwnPropertyNames(exception)) } : {})
            }
        );
}
export function createLoggerOnLogger(origin: Logger, newFixedComplData: any): Logger {
    return (result: string, complData?: any, exception?: any) => origin(result, { ...(newFixedComplData ?? {}), ...(complData ?? {}) }, exception);
}
