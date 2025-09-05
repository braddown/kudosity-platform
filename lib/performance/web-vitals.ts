/**
 * Web Vitals Performance Monitoring
 * 
 * This module provides comprehensive performance monitoring for Core Web Vitals
 * and custom performance metrics throughout the application.
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'
import { logger } from "@/lib/utils/logger"

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals thresholds (Google recommendations)
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint  
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  
  // Additional metrics
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  
  // Custom app metrics
  PROFILE_LOAD: { good: 1000, needsImprovement: 2000 },
  LOGS_LOAD: { good: 1500, needsImprovement: 3000 },
  CAMPAIGN_LOAD: { good: 1200, needsImprovement: 2500 },
} as const

// Metric categories for analysis
export type MetricName = keyof typeof PERFORMANCE_THRESHOLDS
export type MetricValue = number
export type MetricRating = 'good' | 'needs-improvement' | 'poor'

export interface PerformanceMetric {
  name: string
  value: number
  rating: MetricRating
  timestamp: number
  url: string
  id: string
}

export interface CustomMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private customMetrics: Map<string, CustomMetric> = new Map()
  private isProduction = process.env.NODE_ENV === 'production'
  
  constructor() {
    this.initWebVitals()
    this.initCustomMetrics()
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    onLCP((metric) => {
      this.recordMetric('LCP', metric.value, metric.id)
    })

    // Interaction to Next Paint
    onINP((metric) => {
      this.recordMetric('INP', metric.value, metric.id)
    })

    // Cumulative Layout Shift
    onCLS((metric) => {
      this.recordMetric('CLS', metric.value, metric.id)
    })

    // First Contentful Paint
    onFCP((metric) => {
      this.recordMetric('FCP', metric.value, metric.id)
    })

    // Time to First Byte
    onTTFB((metric) => {
      this.recordMetric('TTFB', metric.value, metric.id)
    })
  }

  /**
   * Initialize custom performance metrics
   */
  private initCustomMetrics() {
    if (typeof window === 'undefined') return

    // Listen for navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.recordMetric('DOM_CONTENT_LOADED', navigation.domContentLoadedEventEnd - navigation.fetchStart)
        this.recordMetric('LOAD_COMPLETE', navigation.loadEventEnd - navigation.fetchStart)
      }
    })
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, id?: string) {
    const rating = this.getMetricRating(name as MetricName, value)
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      id: id || `${name}-${Date.now()}`
    }

    this.metrics.push(metric)
    
    // Console logging in development
    if (!this.isProduction) {
      logger.debug(`📊 Performance Metric: ${name}`, {
        value: `${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'}`,
        rating,
        threshold: PERFORMANCE_THRESHOLDS[name as MetricName] || 'custom'
      })
    }

    // Send to analytics in production
    if (this.isProduction) {
      this.sendToAnalytics(metric)
    }
  }

  /**
   * Get rating for a metric based on thresholds
   */
  private getMetricRating(name: MetricName, value: number): MetricRating {
    const threshold = PERFORMANCE_THRESHOLDS[name]
    if (!threshold) return 'good' // Default for custom metrics

    if (name === 'CLS') {
      // CLS is measured differently (not in milliseconds)
      if (value <= threshold.good) return 'good'
      if (value <= threshold.needsImprovement) return 'needs-improvement'
      return 'poor'
    } else {
      if (value <= threshold.good) return 'good'
      if (value <= threshold.needsImprovement) return 'needs-improvement'
      return 'poor'
    }
  }

  /**
   * Start measuring a custom operation
   */
  startMeasurement(name: string, metadata?: Record<string, any>): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const startTime = performance.now()
    
    this.customMetrics.set(id, {
      name,
      startTime,
      metadata
    })

    // Add performance mark
    performance.mark(`${name}-start-${id}`)

    return id
  }

  /**
   * End measuring a custom operation
   */
  endMeasurement(id: string): number | null {
    const metric = this.customMetrics.get(id)
    if (!metric) {
      logger.warn(`Performance measurement not found: ${id}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime
    
    // Update the metric
    metric.endTime = endTime
    metric.duration = duration

    // Add performance mark and measure
    performance.mark(`${metric.name}-end-${id}`)
    performance.measure(`${metric.name}-${id}`, `${metric.name}-start-${id}`, `${metric.name}-end-${id}`)

    // Record the metric
    this.recordMetric(metric.name, duration, id)

    // Clean up
    this.customMetrics.delete(id)

    return duration
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const measurementId = this.startMeasurement(name, metadata)
    
    try {
      const result = await operation()
      this.endMeasurement(measurementId)
      return result
    } catch (error) {
      this.endMeasurement(measurementId)
      // Record error metric
      this.recordMetric(`${name}_ERROR`, 1)
      throw error
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const summary = {
      total: this.metrics.length,
      good: 0,
      needsImprovement: 0,
      poor: 0,
      byMetric: {} as Record<string, { count: number; avgValue: number; rating: MetricRating }>
    }

    this.metrics.forEach(metric => {
      // Count by rating
      summary[metric.rating.replace('-', '') as keyof typeof summary]++

      // Group by metric name
      if (!summary.byMetric[metric.name]) {
        summary.byMetric[metric.name] = { count: 0, avgValue: 0, rating: 'good' }
      }
      
      const metricSummary = summary.byMetric[metric.name]
      metricSummary.count++
      metricSummary.avgValue = (metricSummary.avgValue * (metricSummary.count - 1) + metric.value) / metricSummary.count
      
      // Use worst rating for the metric
      if (metric.rating === 'poor' || (metric.rating === 'needs-improvement' && metricSummary.rating === 'good')) {
        metricSummary.rating = metric.rating
      }
    })

    return summary
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric) {
    // This would integrate with your analytics service
    // Examples: Google Analytics 4, Datadog, New Relic, etc.
    
    // Example for Google Analytics 4:
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'web_vital', {
        custom_map: { metric_name: 'dimension1' },
        metric_name: metric.name,
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.rating,
        non_interaction: true,
      })
    }

    // Example for custom analytics endpoint:
    if (this.isProduction) {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      }).catch(error => {
        logger.error('Failed to send performance metric:', error)
      })
    }
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics() {
    this.metrics = []
    this.customMetrics.clear()
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor()

// Convenience functions
export const startMeasurement = (name: string, metadata?: Record<string, any>) => 
  performanceMonitor.startMeasurement(name, metadata)

export const endMeasurement = (id: string) => 
  performanceMonitor.endMeasurement(id)

export const measureAsync = <T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>) =>
  performanceMonitor.measureAsync(name, operation, metadata)

// Hook for React components
export const usePerformanceMetrics = () => {
  return {
    startMeasurement,
    endMeasurement,
    measureAsync,
    getMetrics: () => performanceMonitor.getMetrics(),
    getSummary: () => performanceMonitor.getMetricsSummary(),
    clearMetrics: () => performanceMonitor.clearMetrics(),
  }
}