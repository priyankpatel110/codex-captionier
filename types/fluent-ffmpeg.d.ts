declare module "fluent-ffmpeg" {
  type FfmpegErrorHandler = (error: Error) => void
  type FfmpegEndHandler = () => void

  interface FfmpegCommand {
    noVideo(): FfmpegCommand
    audioChannels(channels: number): FfmpegCommand
    audioFrequency(frequency: number): FfmpegCommand
    format(format: string): FfmpegCommand
    outputOptions(options: string[]): FfmpegCommand
    save(path: string): FfmpegCommand
    seekInput(seconds: number): FfmpegCommand
    duration(seconds: number): FfmpegCommand
    on(event: "end", handler: FfmpegEndHandler): FfmpegCommand
    on(event: "error", handler: FfmpegErrorHandler): FfmpegCommand
    run(): void
  }

  interface FfmpegStatic {
    (input?: string): FfmpegCommand
    setFfmpegPath(path: string): void
  }

  const ffmpeg: FfmpegStatic
  export default ffmpeg
}
