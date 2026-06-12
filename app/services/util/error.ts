export class AxiosError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number, name: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
  }
}
