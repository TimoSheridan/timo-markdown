export class LanguageError extends Error {
  constructor(path, line, column, code, message) {
    super(`${path}:${line}:${column} ${code} ${message}`);
    this.name = "LanguageError";
    this.path = path;
    this.line = line;
    this.column = column;
    this.code = code;
  }
}
