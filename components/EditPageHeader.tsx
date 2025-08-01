import { EditActionButtons } from "@/components/EditActionButtons"

interface EditPageHeaderProps {
  title: string
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
  saveText?: string
}

export function EditPageHeader({ title, onSave, onCancel, isSaving = false, saveText = "Save" }: EditPageHeaderProps) {
  return (
    <div className="w-full border-b border-gray-200 py-4 px-4 flex justify-between items-center max-w-full sticky top-0 bg-white z-10">
      <h2 className="text-2xl font-semibold pl-4">{title}</h2>
      <EditActionButtons onSave={onSave} onCancel={onCancel} isSaving={isSaving} saveText={saveText} />
    </div>
  )
}
