"use client"
import { Battery, Wifi } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SplitMessage {
  content: string
  delay_seconds: number
  wait_for_delivery: boolean
}

interface PhonePreviewProps {
  message: string
  senderID?: string
  showTestInput?: boolean
  showPreviewInfo?: boolean
  className?: string
  splitMessages?: SplitMessage[]
}

export default function PhonePreview({
  message,
  senderID = "Kudosity",
  showTestInput = false,
  showPreviewInfo = true,
  className = "",
  splitMessages = [],
}: PhonePreviewProps) {
  const totalLength = message.length + splitMessages.reduce((acc, msg) => acc + msg.content.length, 0)
  const totalSmsCount = Math.ceil(message.length / 160) + splitMessages.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 160), 0) || 1

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-[320px] h-[640px] bg-gradient-to-b from-slate-700 to-slate-800 rounded-[40px] p-2 shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-[32px] overflow-hidden flex flex-col relative">
              {/* Status Bar */}
              <div className="flex justify-between items-center px-6 py-3 text-white text-sm font-medium">
                <span>2:25 PM</span>
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                  </div>
                  <Wifi className="h-4 w-4 text-white" />
                  <Battery className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>

              {/* Header */}
              <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-slate-600/30">
                <h3 className="font-semibold text-white text-center">{senderID}</h3>
              </div>

              {/* Messages Area */}
              <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
                <p className="text-slate-400 text-xs text-center">Text Message</p>

                {/* Main Message Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message || "Your touchpoint message will appear here..."}
                      </p>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 text-right">2:26 PM</p>
                  </div>
                </div>

                {/* Split Messages */}
                {splitMessages.map((splitMsg, index) => (
                  <div key={index}>
                    {/* Delay indicator */}
                    <div className="flex justify-center my-2">
                      <div className="text-slate-500 text-xs px-2 py-1 bg-slate-700/50 rounded-full">
                        {splitMsg.delay_seconds}s delay{splitMsg.wait_for_delivery ? ' after delivery' : ''}
                      </div>
                    </div>
                    
                    {/* Split message bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {splitMsg.content || `Message ${index + 2} content...`}
                          </p>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 text-right">
                          2:{26 + index + 1} PM
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Test Input Area */}
              {showTestInput && (
                <div className="bg-slate-700/30 backdrop-blur-sm p-4 border-t border-slate-600/30">
                  <div className="flex items-center space-x-3">
                    <Input
                      className="flex-1 bg-slate-600/50 border-slate-500 text-white placeholder:text-slate-400 text-sm"
                      placeholder="Enter your number"
                    />
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white px-4">
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      {showPreviewInfo && (
        <div className="mt-6 text-center">
          <h4 className="font-semibold text-sm text-foreground mb-2">Message Preview</h4>
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <span>{totalLength} characters</span>
            <span>•</span>
            <span>{totalSmsCount} SMS</span>
            {splitMessages.length > 0 && (
              <>
                <span>•</span>
                <span>{splitMessages.length + 1} messages</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
