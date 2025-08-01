"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tag, MoreHorizontal, Download, Settings, Smile } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Message {
  id: number
  senderId: string
  message: string
  time: string
  timeUnit: string
  timeRelation: string
  timeEvent: string
  filter: string
  action: string
  tag?: boolean
  expanded?: boolean
}

const initialMessages: Message[] = [
  {
    id: 1,
    senderId: "61480001008",
    message: "Hi [FirstName], This is an activation message..",
    time: "2",
    timeUnit: "minutes",
    timeRelation: "after",
    timeEvent: "activation",
    filter: "Only send if custom field balance > $51",
    action: "Do nothing",
    tag: true,
  },
  {
    id: 2,
    senderId: "61480001008",
    message: "This message is sent on Thursday after 1st d..",
    time: "15:00:00 PM",
    timeUnit: "days",
    timeRelation: "after",
    timeEvent: "wednesday following first day of the month",
    filter: "Do not send if custom field country equals USA",
    action: "Do nothing",
    tag: true,
  },
]

export default function JourneyCanvas() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null)
  const [trackLink, setTrackLink] = useState("https://www.burstsms.com")
  const [messageText, setMessageText] = useState("")

  const handleExpandMessage = (id: number) => {
    setExpandedMessage(expandedMessage === id ? null : id)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Training Journey</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">No</TableHead>
            <TableHead className="w-[120px]">Sender ID</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Timing Offset</TableHead>
            <TableHead>Filter</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              <TableRow className="cursor-pointer" onClick={() => handleExpandMessage(message.id)}>
                <TableCell>{message.id}</TableCell>
                <TableCell>{message.senderId}</TableCell>
                <TableCell className="flex items-center gap-2">
                  {message.message}
                  {message.tag && (
                    <Badge variant="outline">
                      <Tag className="h-3 w-3" />
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{message.time}</TableCell>
                <TableCell>{message.timeEvent}</TableCell>
                <TableCell>{message.filter}</TableCell>
                <TableCell>{message.action}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedMessage === message.id && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <Label>Message {message.id} timing</Label>
                            <div className="flex gap-2">
                              <Select defaultValue={message.time}>
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2">2</SelectItem>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select defaultValue={message.timeUnit}>
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="minutes">minutes</SelectItem>
                                  <SelectItem value="hours">hours</SelectItem>
                                  <SelectItem value="days">days</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select defaultValue={message.timeRelation}>
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="after">after</SelectItem>
                                  <SelectItem value="before">before</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select defaultValue={message.timeEvent}>
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="activation">activation</SelectItem>
                                  <SelectItem value="previous">previous message</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Repeat every</Label>
                            <div className="flex gap-2">
                              <Input type="number" className="w-[100px]" defaultValue="0" />
                              <Select defaultValue="no-repeat">
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no-repeat">no repeat</SelectItem>
                                  <SelectItem value="days">days</SelectItem>
                                  <SelectItem value="weeks">weeks</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Message</Label>
                            <Textarea
                              value={message.message}
                              onChange={(e) => setMessageText(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                              <div>Character count: 78 | SMS count: 1</div>
                              <Button variant="ghost" size="sm">
                                <Smile className="h-4 w-4 mr-2" />
                                Add Emoji
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Track Link</Label>
                            <div className="flex gap-2">
                              <Input
                                value={trackLink}
                                onChange={(e) => setTrackLink(e.target.value)}
                                className="flex-1"
                              />
                              <Button>Insert link</Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Personalization</Label>
                            <div className="flex flex-wrap gap-2">
                              {["FirstName", "LastName", "date", "time", "mobile", "email", "balance"].map((tag) => (
                                <Badge key={tag} variant="outline" className="cursor-pointer">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Filter</Label>
                            <Select defaultValue="custom">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">custom field</SelectItem>
                                <SelectItem value="system">system field</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-4">
                            <Label>Condition</Label>
                            <div className="flex gap-2">
                              <Select defaultValue="custom">
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="custom">custom field</SelectItem>
                                  <SelectItem value="balance">balance</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select defaultValue="greater">
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="greater">is greater than</SelectItem>
                                  <SelectItem value="less">is less than</SelectItem>
                                  <SelectItem value="equals">equals</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input defaultValue="51" className="w-[200px]" />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Action</Label>
                            <Select defaultValue="nothing">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nothing">Do nothing</SelectItem>
                                <SelectItem value="send">Send message</SelectItem>
                                <SelectItem value="wait">Wait</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex justify-between pt-6">
                            <Button variant="outline">Add Filter</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
