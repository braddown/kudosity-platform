/**
 * Performance Dashboard Component
 * 
 * A comprehensive dashboard for monitoring application performance metrics,
 * including Core Web Vitals, custom metrics, and real-time performance data.
 */

"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Monitor,
  Cpu,
  HardDrive
} from 'lucide-react'
import { performanceMonitor, PERFORMANCE_THRESHOLDS, type PerformanceMetric } from '@/lib/performance/web-vitals'

interface PerformanceDashboardProps {
  className?: string
  showDetailedMetrics?: boolean
  refreshInterval?: number
}

interface MetricCardProps {
  title: string
  value: number
  unit: string
  threshold: { good: number; needsImprovement: number }
  description: string
  icon: React.ReactNode
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  threshold,
  description,
  icon
}) => {
  const getRating = (val: number, thresh: typeof threshold) => {
    if (val <= thresh.good) return 'good'
    if (val <= thresh.needsImprovement) return 'needs-improvement'
    return 'poor'
  }

  const rating = getRating(value, threshold)
  const percentage = Math.min((value / threshold.needsImprovement) * 100, 100)

  const ratingColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  }

  const ratingIcons = {
    good: <CheckCircle className="h-4 w-4" />,
    'needs-improvement': <AlertTriangle className="h-4 w-4" />,
    poor: <AlertTriangle className="h-4 w-4" />
  }

  return (
    <Card className={ratingColors[rating]}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Badge variant={rating === 'good' ? 'default' : rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
            {ratingIcons[rating]}
            {rating.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(0)}{unit}
        </div>
        <div className="mt-2">
          <Progress value={percentage} className="h-2" />
        </div>
        <CardDescription className="mt-2 text-xs">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

export default function PerformanceDashboard({
  className = '',
  showDetailedMetrics = true,
  refreshInterval = 30000 // 30 seconds
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [systemMetrics, setSystemMetrics] = useState({
    memoryUsage: 0,
    jsHeapSize: 0,
    domNodes: 0,
    eventListeners: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Refresh metrics
  const refreshMetrics = async () => {
    setIsRefreshing(true)
    
    try {
      // Get performance metrics
      const currentMetrics = performanceMonitor.getMetrics()
      setMetrics(currentMetrics)
      
      // Get system metrics
      if (typeof window !== 'undefined' && 'performance' in window) {
        const memory = (performance as any).memory
        setSystemMetrics({
          memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
          jsHeapSize: memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : 0,
          domNodes: document.querySelectorAll('*').length,
          eventListeners: 0 // Would need custom tracking
        })
      }
      
      setLastUpdated(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh
  useEffect(() => {
    refreshMetrics()
    const interval = setInterval(refreshMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    const summary = performanceMonitor.getMetricsSummary()
    const latestMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.name] || metric.timestamp > acc[metric.name].timestamp) {
        acc[metric.name] = metric
      }
      return acc
    }, {} as Record<string, PerformanceMetric>)

    return {
      summary,
      latest: latestMetrics,
      trends: {
        improving: summary.good / summary.total * 100,
        declining: summary.poor / summary.total * 100
      }
    }
  }, [metrics])

  // Web Vitals metrics
  const webVitalsMetrics = [
    {
      key: 'LCP',
      title: 'Largest Contentful Paint',
      description: 'Loading performance',
      icon: <Clock className="h-4 w-4" />,
      unit: 'ms'
    },
    {
      key: 'INP',
      title: 'Interaction to Next Paint',
      description: 'Interactivity',
      icon: <Zap className="h-4 w-4" />,
      unit: 'ms'
    },
    {
      key: 'CLS',
      title: 'Cumulative Layout Shift',
      description: 'Visual stability',
      icon: <Activity className="h-4 w-4" />,
      unit: ''
    },
    {
      key: 'FCP',
      title: 'First Contentful Paint',
      description: 'Loading performance',
      icon: <Monitor className="h-4 w-4" />,
      unit: 'ms'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor application performance and Core Web Vitals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(summaryMetrics.trends.improving)}%
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Good Performance
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {Math.round((summaryMetrics.summary.needsImprovement / summaryMetrics.summary.total) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Needs Improvement
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {Math.round(summaryMetrics.trends.declining)}%
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingDown className="h-4 w-4" />
                Poor Performance
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="core-vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="core-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="custom-metrics">Custom Metrics</TabsTrigger>
          <TabsTrigger value="system-info">System Info</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Core Web Vitals Tab */}
        <TabsContent value="core-vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {webVitalsMetrics.map(({ key, title, description, icon, unit }) => {
              const metric = summaryMetrics.latest[key]
              const threshold = PERFORMANCE_THRESHOLDS[key as keyof typeof PERFORMANCE_THRESHOLDS]
              
              if (!metric || !threshold) {
                return (
                  <Card key={key} className="opacity-50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {icon}
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-muted-foreground">--</div>
                      <CardDescription className="mt-2 text-xs">
                        No data available
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <MetricCard
                  key={key}
                  title={title}
                  value={metric.value}
                  unit={unit}
                  threshold={threshold}
                  description={description}
                  icon={icon}
                />
              )
            })}
          </div>
        </TabsContent>

        {/* Custom Metrics Tab */}
        <TabsContent value="custom-metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summaryMetrics.latest)
              .filter(([key]) => !['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(key))
              .map(([key, metric]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metric.value.toFixed(0)}ms
                    </div>
                    <Badge variant={metric.rating === 'good' ? 'default' : 'secondary'}>
                      {metric.rating}
                    </Badge>
                    <CardDescription className="mt-2 text-xs">
                      Recorded {new Date(metric.timestamp).toLocaleTimeString()}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system-info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.memoryUsage}MB</div>
                <Progress value={(systemMetrics.memoryUsage / systemMetrics.jsHeapSize) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  JS Heap Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.jsHeapSize}MB</div>
                <CardDescription className="mt-2 text-xs">
                  Total allocated memory
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  DOM Nodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.domNodes.toLocaleString()}</div>
                <CardDescription className="mt-2 text-xs">
                  Total elements in DOM
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(summaryMetrics.trends.improving)}
                </div>
                <CardDescription className="mt-2 text-xs">
                  Out of 100
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {summaryMetrics.trends.declining > 20 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Performance Issues Detected:</strong> {Math.round(summaryMetrics.trends.declining)}% of metrics show poor performance. 
                  Consider implementing code splitting and optimizing heavy components.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🚀 Performance Optimizations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• Enable code splitting for large components</div>
                  <div>• Implement virtualization for large lists ({systemMetrics.domNodes > 1000 ? 'Recommended' : 'Not needed'})</div>
                  <div>• Optimize images with Next.js Image component</div>
                  <div>• Use React.memo for expensive components</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🔧 Technical Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• Monitor Core Web Vitals regularly</div>
                  <div>• Set up performance budgets in CI/CD</div>
                  <div>• Use lighthouse CI for automated testing</div>
                  <div>• Implement proper caching strategies</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}