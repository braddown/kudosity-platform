"use client"

import type React from "react"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import PhonePreview from "./PhonePreview"

interface AutomationAction {
  suppressProfile: boolean
  hideFromInbox: boolean
  sendWebhook: boolean
  addToList: boolean
  listName?: string
}

interface AutomationRule {
  id: string
  title: string
  description: string
  active: boolean
  message: string
  sendAutoReply: boolean
  characterCount: number
  smsCount: number
  actions: AutomationAction
}

const ReplyAutomation: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "opt-out",
      title: "Opt Out",
      description: "This reply will be sent when a contact opts out of receiving messages.",
      active: true,
      message: "You have been unsubscribed from our messages. Reply START to opt back in.",
      sendAutoReply: false,
      characterCount: 73,
      smsCount: 1,
      actions: {
        suppressProfile: true,
        hideFromInbox: true,
        sendWebhook: false,
        addToList: true,
        listName: "Global Opt-Out",
      },
    },
    {
      id: "wrong-number",
      title: "Wrong Number",
      description:
        "This reply will be automatically sent if a wrong number intent response is received. e.g. You have the wrong number or This is not Peter.",
      active: true,
      message:
        "We apologize for the confusion. It seems we have the wrong number. We'll correct our records immediately. Thank you for letting us know.",
      sendAutoReply: true,
      characterCount: 136,
      smsCount: 1,
      actions: {
        suppressProfile: true,
        hideFromInbox: true,
        sendWebhook: false,
        addToList: false,
      },
    },
    {
      id: "thank-you",
      title: "Thank You",
      description:
        "This reply will be automatically sent if a thank you intent is received. e.g. Thanks or That's great, cheers.",
      active: true,
      message: "Thank you for contacting support.",
      sendAutoReply: true,
      characterCount: 33,
      smsCount: 1,
      actions: {
        suppressProfile: false,
        hideFromInbox: false,
        sendWebhook: false,
        addToList: true,
        listName: "Engaged",
      },
    },
  ])

  const [focusedRuleId, setFocusedRuleId] = useState<string | null>(null)

  const updateRule = (ruleId: string, updates: Partial<AutomationRule>) => {
    setRules(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)))
  }

  const updateRuleActions = (ruleId: string, actionUpdates: Partial<AutomationAction>) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              actions: { ...rule.actions, ...actionUpdates },
            }
          : rule,
      ),
    )
  }

  const updateMessage = (ruleId: string, message: string) => {
    const characterCount = message.length
    const smsCount = Math.ceil(characterCount / 160) || 1
    updateRule(ruleId, { message, characterCount, smsCount })
  }

  const listOptions = ["Global Opt-Out", "Engaged", "Prospects", "Customers", "Support Tickets"]

  const getCurrentPreviewMessage = () => {
    if (!focusedRuleId) return "Select a message field to preview"
    const focusedRule = rules.find((r) => r.id === focusedRuleId)
    return focusedRule?.message || "Enter your auto-reply message..."
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 w-full min-h-screen">
      <div className="space-y-6">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{rule.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={rule.active}
                    onCheckedChange={(checked) => updateRule(rule.id, { active: checked })}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{rule.description}</p>

              {/* Message Input */}
              <div className="space-y-2">
                <Textarea
                  value={rule.message}
                  onChange={(e) => updateMessage(rule.id, e.target.value)}
                  onFocus={() => setFocusedRuleId(rule.id)}
                  onBlur={() => setFocusedRuleId(null)}
                  className="min-h-[100px] resize-none"
                  placeholder="Enter your auto-reply message..."
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.sendAutoReply}
                        onCheckedChange={(checked) => updateRule(rule.id, { sendAutoReply: checked })}
                      />
                      <span className="text-sm">Send Auto-Reply</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{rule.characterCount}/612</span>
                    <Badge variant="outline" className="text-xs">
                      {rule.smsCount} SMS
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h4 className="font-medium">Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suppress Profile</span>
                    <Switch
                      checked={rule.actions.suppressProfile}
                      onCheckedChange={(checked) => updateRuleActions(rule.id, { suppressProfile: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hide from Inbox</span>
                    <Switch
                      checked={rule.actions.hideFromInbox}
                      onCheckedChange={(checked) => updateRuleActions(rule.id, { hideFromInbox: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Send Webhook</span>
                    <Switch
                      checked={rule.actions.sendWebhook}
                      onCheckedChange={(checked) => updateRuleActions(rule.id, { sendWebhook: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Add to List</span>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.actions.addToList}
                        onCheckedChange={(checked) => updateRuleActions(rule.id, { addToList: checked })}
                      />
                      {rule.actions.addToList && (
                        <Select
                          value={rule.actions.listName}
                          onValueChange={(value) => updateRuleActions(rule.id, { listName: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {listOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-col h-full">
        <Card className="shadow-sm h-full bg-gray-100 overflow-hidden">
          <CardContent className="p-12 flex flex-col">
            <div className="flex-grow flex items-center justify-center">
              <PhonePreview
                message={getCurrentPreviewMessage()}
                senderID="Auto Reply"
                showTestInput={false}
                showPreviewInfo={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReplyAutomation
