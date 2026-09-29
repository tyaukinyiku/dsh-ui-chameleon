/**
 * 编译期 shim —— 仅覆盖本仓库实际用到的 @deepseek-ai/* 与第三方 API 子集。
 *
 * 背景：本插件在 deepseek-harness 仓库之外开发，离线环境装不到真实的
 * @deepseek-ai/cordis / dsh-storage-domain / dsh-typert-protocol / schemastery / zod / react。
 * 这些声明让 `npm run check` 可以离线通过，签名严格对照官方文档：
 *   - https://deepseek-harness.github.io/deepseek-harness/develop/basic/
 *   - https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/storage
 *   - https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/slots
 *   - https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/settings
 *
 * 在 deepseek-harness 仓库内构建时：删除本目录，改用真实包类型。
 * 如与真实签名有出入，以真实包为准并同步修正本文件。
 */

declare const process: { cwd(): string; env: Record<string, string | undefined> }

declare function fetch(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{
  ok: boolean
  status: number
  statusText: string
  text(): Promise<string>
  json(): Promise<unknown>
  arrayBuffer(): Promise<ArrayBuffer>
}>

/** host 侧二进制拼接（node 运行时自带；仅覆盖本仓库用到的子集）。 */
declare const Buffer: {
  from(data: string | ArrayBufferView | ArrayBuffer): Uint8Array
}

declare module '@deepseek-ai/cordis' {
  export interface Context {
    /** dsh 的服务挂在 ctx 上（ctx.uiSkins、ctx.slots、ctx.storageDomain、ctx.settings……）。 */
    readonly [key: string]: any
    /** 注册子 Fiber；class 形式插件以 (ctx, options) 实例化。 */
    plugin(plugin: unknown, options?: unknown): { dispose(): Promise<void> }
    /** 声明副作用；返回的 disposer 在插件卸载时执行。 */
    effect(setup: () => void | (() => void | Promise<void>), tag?: string): void
    on(event: string, listener: (...args: never[]) => unknown): () => void
    emit(event: string, ...args: unknown[]): void
    /** 可选依赖探测（未就绪返回 undefined）。 */
    get?(name: string): unknown
  }

  export abstract class Service {
    static inject?: readonly string[]
    constructor(ctx: Context, name: string)
    readonly ctx: Context
  }
}

declare module '@deepseek-ai/schemastery' {
  type Infer<S> = S extends Schema<infer T> ? T : never

  class Schema<T = unknown> {
    readonly _output?: T
    static object<S extends Record<string, Schema<unknown>>>(
      shape: S,
    ): Schema<{ [K in keyof S]: Infer<S[K]> }>
    static string(): Schema<string>
    static number(): Schema<number>
    static boolean(): Schema<boolean>
    static dict<U>(item: Schema<U>): Schema<Record<string, U>>
    static any(): Schema<unknown>
    static union<U extends Schema<unknown>>(options: readonly U[]): Schema<Infer<U>>
    default(value: T): Schema<T>
    required(): Schema<T>
    optional(): Schema<T | undefined>
    toJSON(): unknown
  }

  export default Schema
}

declare module 'zod' {
  export interface ZodType<T = unknown> {
    readonly _output?: T
    optional(): ZodType<T | undefined>
    nullable(): ZodType<T | null>
  }

  export const z: {
    object<S extends Record<string, ZodType<unknown>>>(
      shape: S,
    ): ZodType<{ [K in keyof S]: S[K] extends ZodType<infer T> ? T : never }>
    string(): ZodType<string>
    number(): ZodType<number>
    boolean(): ZodType<boolean>
    /** zod v4 签名：键 schema + 值 schema。 */
    record<K extends string, T>(key: ZodType<K>, value: ZodType<T>): ZodType<Record<K, T>>
    unknown(): ZodType<unknown>
    nullable<T>(value: ZodType<T>): ZodType<T | null>
    optional<T>(value: ZodType<T>): ZodType<T | undefined>
    any(): ZodType<unknown>
  }
}

declare module 'node:http' {
  export interface IncomingMessage {
    url?: string
    method?: string
    setEncoding(encoding: string): void
    on(event: 'data', listener: (chunk: string) => void): unknown
    on(event: 'end' | 'close', listener: () => void): unknown
    on(event: 'error', listener: (error: unknown) => void): unknown
  }

  export interface ServerResponse {
    writeHead(statusCode: number, headers?: Record<string, string>): void
    write(chunk: string): boolean
    end(chunk?: string | Uint8Array): void
    setHeader(name: string, value: string): void
  }
}

declare module '@deepseek-ai/dsh-storage-domain' {
  /** 编译期表声明（键为 phantom 类型）。 */
  export interface DomainTableSpec<K, V> {
    readonly __key?: K
    readonly __value?: V
  }

  export interface DomainSpecLike {
    readonly name: string
    readonly version: number
    readonly layout?: 'single' | 'per-record'
    readonly compatibleVersions?: readonly number[]
    readonly invalidRecords?: 'backup-and-skip'
    readonly global?: unknown
    readonly tables: Record<string, DomainTableSpec<unknown, unknown>>
  }

  /** 固定 spec 的字面量类型；领域名/表名须匹配 UNIT_NAME_RE。 */
  export function defineDomain<S extends DomainSpecLike>(spec: S): S
  /** 声明一张表；schema 为 zod schema（真实包里经 z.infer 推导 V）。 */
  export function domainTable<K, V>(schema: unknown): DomainTableSpec<K, V>
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  /** Typert Remote 方法装饰器：@Remote('verb') 或 @Remote({ mode: 'stream' })。 */
  export type RemoteSpec = string | { mode?: 'unary' | 'stream' }
  export function Remote(spec?: RemoteSpec): MethodDecorator
}

declare module 'react' {
  export type ReactNode = unknown
  export type ComponentType<P = Record<string, never>> = (props: P) => ReactNode
  export function createElement(type: unknown, props?: unknown, ...children: ReactNode[]): unknown
  export const Fragment: unknown
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  export function useMemo<T>(factory: () => T, deps?: readonly unknown[]): T
  const React: {
    createElement: typeof createElement
    Fragment: unknown
    useEffect: typeof useEffect
    useMemo: typeof useMemo
  }
  export default React
}

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
  export function readFileSync(path: string): Uint8Array
  export function statSync(path: string): { mtimeMs: number; size: number; isDirectory(): boolean }
  export function existsSync(path: string): boolean
  export function readdirSync(path: string): string[]
}

declare module 'node:path' {
  export function join(...parts: string[]): string
  export function basename(path: string): string
  export function extname(path: string): string
  export function resolve(...parts: string[]): string
  export const sep: string
}

declare module 'node:crypto' {
  export function createHash(algorithm: string): {
    update(data: string | Uint8Array): { digest(encoding: 'hex'): string }
  }
}
