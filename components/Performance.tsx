"use client"

import { logger } from "@/lib/utils/logger"
import type React from "react"
import { useState, useEffect } from "react"

interface LogEntry {
  id: string
  timestamp: string
  level: string
  message: string
  resourceId: string
  traceId: string
  spanId: string
  commit: string
  metadata: {
    parentResourceId: string
  }
}

interface MessageEntry {
  id: string
  timestamp: string
  message: string
  resourceId: string
}

const Performance: React.FC = () => {
  const [data, setData] = useState<LogEntry[]>([])
  const [messages, setMessages] = useState<MessageEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("1h")
  const [eventTypes, setEventTypes] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [timeRange, eventTypes])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch logs data
      const logsResponse = await fetch(`/api/logs?timeRange=${timeRange}&eventTypes=${eventTypes.join(",")}`)
      const logsResult = await logsResponse.json()

      if (!logsResponse.ok) {
        throw new Error(logsResult.error || "Failed to fetch logs")
      }

      // Fetch messages data
      const messagesResponse = await fetch(`/api/messages?timeRange=${timeRange}`)
      const messagesResult = await messagesResponse.json()

      if (!messagesResponse.ok) {
        throw new Error(messagesResult.error || "Failed to fetch messages")
      }

      setData(logsResult.data || [])
      setMessages(messagesResult.data || [])
    } catch (error) {
      logger.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(event.target.value)
  }

  const handleEventTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target
    if (checked) {
      setEventTypes([...eventTypes, value])
    } else {
      setEventTypes(eventTypes.filter((type) => type !== value))
    }
  }

  return (
    <div>
      <h1>Performance Dashboard</h1>

      <div>
        <label htmlFor="timeRange">Time Range:</label>
        <select id="timeRange" value={timeRange} onChange={handleTimeRangeChange}>
          <option value="1h">Last 1 Hour</option>
          <option value="12h">Last 12 Hours</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div>
        <label>Event Types:</label>
        <label>
          <input
            type="checkbox"
            value="error"
            checked={eventTypes.includes("error")}
            onChange={handleEventTypeChange}
          />
          Error
        </label>
        <label>
          <input type="checkbox" value="warn" checked={eventTypes.includes("warn")} onChange={handleEventTypeChange} />
          Warning
        </label>
        <label>
          <input type="checkbox" value="info" checked={eventTypes.includes("info")} onChange={handleEventTypeChange} />
          Info
        </label>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <h2>Logs</h2>
      <ul>
        {data.map((log) => (
          <li key={log.id}>
            {log.timestamp} - {log.level} - {log.message}
          </li>
        ))}
      </ul>

      <h2>Messages</h2>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            {message.timestamp} - {message.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Performance
