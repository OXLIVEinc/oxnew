declare module "uuid" {
  export function v4(): string;
}
declare module "nanoid" {
  export function nanoid(size?: number): string;
}
declare module "qrcode" {
  const QRCode: {
    toBuffer(text: string, opts?: any): Promise<Buffer>;
  };
  export default QRCode;
}
declare module "sharp" {
  export interface OverlayOptions {
    input: Buffer | string;
    left?: number;
    top?: number;
  }

  interface SharpInstance {
    resize(...args: any[]): SharpInstance;
    png(opts?: any): SharpInstance;
    blur(n?: number): SharpInstance;
    composite(opts: OverlayOptions[]): SharpInstance;
    toBuffer(): Promise<Buffer>;
  }

  function sharp(input: Buffer | string): SharpInstance;

  export default sharp;
}
declare module "jsonwebtoken" {
  const jwt: {
    sign(payload: any, secret: string, opts?: any): string;
    verify(token: string, secret: string): any;
  };
  export default jwt;
}
declare module "bullmq" {
  export class Queue {
    constructor(name: string, opts?: any);
    add(name: string, data: any, opts?: any): Promise<any>;
  }
  export class Worker<T = any, R = any, N extends string = string> {
    constructor(name: string, processor: (job: Job<T, R, N>) => Promise<R>, opts?: any);
    on(event: string, cb: (...args: any[]) => void): void;
  }
  export class Job<T = any, R = any, N extends string = string> {
    id?: string;
    name: N;
    data: T;
  }
}
