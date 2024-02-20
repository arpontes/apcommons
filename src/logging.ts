function Log<T>(logObject: T, propName: string) {
    const log = { [propName]: logObject };
    console.log(JSON.stringify(log));
    return logObject;
}

function getDiffMs(fromDt: Date) {
    return new Date().getTime() - fromDt.getTime();
}

export type Logger = <T>(result: string, complData?: T, exception?: any) => { action: string; result?: string; time: number; error?: true; errorData?: string } & T;
export function createLogger(action: string, fixedComplData?: any, propName?: string): Logger {
    const dt = new Date();
    return (result: string, complData?: any, exception?: any) =>
        Log(
            {
                action,
                ...(fixedComplData ?? {}),
                result: result == null || result === "" ? undefined : result,
                time: getDiffMs(dt),
                ...(complData ?? {}),
                ...(exception ? { error: true, errorData: JSON.stringify(exception, Object.getOwnPropertyNames(exception)) } : {})
            },
            propName ? propName : "mdmLogObj"
        );
}
export function createLoggerOnLogger(origin: Logger, newFixedComplData: any): Logger {
    return (result: string, complData?: any, exception?: any) => origin(result, { ...(newFixedComplData ?? {}), ...(complData ?? {}) }, exception);
}
