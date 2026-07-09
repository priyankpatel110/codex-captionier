import { CaptionEditor } from "@/components/caption-editor"

export default async function TranscriptionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CaptionEditor transcriptionId={id} />
}
