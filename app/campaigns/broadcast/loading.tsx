import { LoadingPage } from "@/components/ui/loading"
import { LoadingMessages } from "@/lib/constants/loading-messages"

export default function Loading() {
  return <LoadingPage message={LoadingMessages.CAMPAIGNS} />
}