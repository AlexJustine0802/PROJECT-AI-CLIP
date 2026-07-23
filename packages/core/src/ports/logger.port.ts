/**
 * Structured logger port. Adapters wrap Pino (Node) / structlog (Python). Never console.log.
 */
export type LogFields = Record<string, unknown>;

export interface LoggerPort {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  child(bindings: LogFields): LoggerPort;
}
