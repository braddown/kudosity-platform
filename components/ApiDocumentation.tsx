"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Code, Webhook, Database, FileText, TestTube } from "lucide-react"

export default function ApiDocumentation() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
            <p className="text-muted-foreground mb-4">Get up and running with our API in minutes</p>
            <Button variant="outline" className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <Code className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">API Reference</h3>
            <p className="text-muted-foreground mb-4">Complete endpoint documentation with examples</p>
            <Button variant="outline" className="w-full">
              View Reference
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <Webhook className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Webhooks Guide</h3>
            <p className="text-muted-foreground mb-4">Real-time event notifications setup</p>
            <Button variant="outline" className="w-full">
              Learn More
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Data Models</h3>
            <p className="text-muted-foreground mb-4">Understanding our data structures</p>
            <Button variant="outline" className="w-full">
              View Models
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">SDKs & Libraries</h3>
            <p className="text-muted-foreground mb-4">Official SDKs for popular languages</p>
            <Button variant="outline" className="w-full">
              Download SDKs
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <TestTube className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Testing Tools</h3>
            <p className="text-muted-foreground mb-4">Sandbox environment and testing utilities</p>
            <Button variant="outline" className="w-full">
              Start Testing
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All API requests require authentication using your API key in the Authorization header.
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-sm">
                    curl -H "Authorization: Bearer YOUR_API_KEY" https://api.kudosity.com/v1/messages
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Send Your First Message</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use the messages endpoint to send your first message programmatically.
                </p>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-sm">
                    {`POST /v1/messages
{
  "to": "+1234567890",
  "message": "Hello from Kudosity!"
}`}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Set Up Webhooks</h4>
                <p className="text-sm text-muted-foreground">
                  Configure webhooks to receive real-time notifications about message status, replies, and more.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
