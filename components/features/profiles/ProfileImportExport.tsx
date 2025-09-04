"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Upload, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { createProfile, updateProfile } from '@/lib/api/profiles-api'
import { segmentsApi } from '@/lib/api/segments-api'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('ProfileImportExport')

export interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
  lifecycle_stage?: string
  created_at: string
  updated_at?: string
  last_activity_at?: string
  address_line_1?: string | null
  address_line_2?: string | null
  postal_code?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  location?: string | null
  timezone?: string | null
  language_preferences?: string | null
  device?: string | null
  os?: string | null
  source?: string | null
  notes?: string | null
  tags?: string[]
  custom_fields?: Record<string, any>
  notification_preferences?: Record<string, boolean>
  is_duplicate?: boolean
  duplicate_of_profile_id?: string | null
  merge_status?: string | null
  data_retention_date?: string | null
  account_id?: string
  [key: string]: any
}

interface FieldDefinition {
  value: string
  label: string
  type: string
  options?: { value: string; label: string }[]
}

interface ProfileImportExportProps {
  profiles: Profile[]
  selectedProfiles: Profile[]
  availableFields: FieldDefinition[]
  customFields: FieldDefinition[]
  onProfilesUpdated: () => void
}

export function ProfileImportExport({
  profiles,
  selectedProfiles,
  availableFields,
  customFields,
  onProfilesUpdated
}: ProfileImportExportProps) {
  const { toast } = useToast()
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFields, setExportFields] = useState<string[]>([
    'first_name',
    'last_name',
    'email',
    'mobile',
    'status',
    'created_at'
  ])

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [createSegmentFromImport, setCreateSegmentFromImport] = useState(true)
  const [segmentNameFromImport, setSegmentNameFromImport] = useState('')

  const exportToCSV = () => {
    try {
      const dataToExport = selectedProfiles.length > 0 ? selectedProfiles : profiles
      const headers = exportFields.map(field => 
        availableFields.find(f => f.value === field)?.label || field
      )
      
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(profile =>
          exportFields.map(field => {
            let value = profile[field as keyof Profile]
            if (field.startsWith('custom_fields.')) {
              const customFieldKey = field.replace('custom_fields.', '')
              value = profile.custom_fields?.[customFieldKey]
            }
            
            // Handle arrays
            if (Array.isArray(value)) {
              value = value.join('; ')
            }
            
            // Handle null/undefined
            if (value === null || value === undefined) {
              value = ''
            }
            
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              value = `"${value.replace(/"/g, '""')}"`
            }
            
            return value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `profiles_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setShowExportDialog(false)
      toast({
        title: 'Export Successful',
        description: `Exported ${dataToExport.length} profiles to CSV`
      })
      
      logger.info('CSV export completed', { count: dataToExport.length })
    } catch (error) {
      logger.error('CSV export failed', { error })
      toast({
        title: 'Export Failed',
        description: 'Failed to export profiles',
        variant: 'destructive'
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result as string
        const lines = csv.split('\n')
        const headers = lines[0].split(',').map(header => header.trim())
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(value => value.trim())
            const row: Record<string, string> = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            return row
          })
        
        setCsvHeaders(headers)
        setCsvData(data)
        setSegmentNameFromImport(file.name.replace('.csv', ''))
        
        // Auto-map common fields
        const autoMapping: Record<string, string> = {}
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
            autoMapping[header] = 'first_name'
          } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
            autoMapping[header] = 'last_name'
          } else if (lowerHeader.includes('email')) {
            autoMapping[header] = 'email'
          } else if (lowerHeader.includes('mobile') || lowerHeader.includes('phone')) {
            autoMapping[header] = 'mobile'
          }
        })
        setFieldMapping(autoMapping)
      }
      reader.readAsText(file)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const importCSV = async () => {
    if (!csvData.length) return
    setIsProcessing(true)
    
    try {
      let successCount = 0
      let updatedCount = 0
      let errorCount = 0
      const errors: string[] = []

      const importTag = createSegmentFromImport && segmentNameFromImport.trim()
        ? segmentNameFromImport.trim().toLowerCase().replace(/\s+/g, '_')
        : null

      for (const row of csvData) {
        try {
          const profileData: any = {
            status: 'Active'
          }

          // Map CSV fields to profile fields
          Object.entries(fieldMapping).forEach(([csvField, profileField]) => {
            if (row[csvField] && profileField !== 'ignore') {
              const value = row[csvField].trim()
              if (value) {
                if (profileField.startsWith('custom_fields.')) {
                  const customFieldKey = profileField.replace('custom_fields.', '')
                  if (!profileData.custom_fields) profileData.custom_fields = {}
                  profileData.custom_fields[customFieldKey] = value
                } else {
                  profileData[profileField] = value
                }
              }
            }
          })

          // Add import tag if segment creation is enabled
          if (importTag) {
            if (!profileData.tags) profileData.tags = []
            if (!profileData.tags.includes(importTag)) {
              profileData.tags.push(importTag)
            }
          }

          // Check if profile already exists by email or mobile
          const existingProfile = profiles.find(p => 
            (profileData.email && p.email === profileData.email) ||
            (profileData.mobile && p.mobile === profileData.mobile)
          )

          if (existingProfile) {
            // Update existing profile
            await updateProfile(existingProfile.id, profileData)
            updatedCount++
          } else {
            // Create new profile
            await createProfile(profileData)
            successCount++
          }
        } catch (error) {
          logger.error('Failed to import profile row', { error, row })
          errorCount++
          errors.push(`Row ${csvData.indexOf(row) + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Create segment from import if requested
      if (createSegmentFromImport && segmentNameFromImport.trim() && importTag) {
        try {
          const creatorId = localStorage.getItem('user_id') || 'unknown'
          await segmentsApi.createSegment({
            name: segmentNameFromImport.trim(),
            description: `Imported from ${csvFile?.name || 'CSV'} on ${new Date().toLocaleString()}. ${successCount} new, ${updatedCount} updated.`,
            creator_id: creatorId,
            filter_criteria: {
              conditions: [{
                field: 'tags',
                operator: 'contains',
                value: importTag
              }],
              profileType: 'all',
              searchTerm: ''
            },
            estimated_size: successCount + updatedCount,
            type: 'dynamic',
            shared: false,
            tags: [importTag]
          })
          logger.info('Import segment created', { name: segmentNameFromImport.trim() })
        } catch (error) {
          logger.error('Failed to create import segment', { error })
        }
      }

      // Show results
      toast({
        title: 'Import Complete',
        description: `${successCount} new profiles, ${updatedCount} updated profiles${errorCount > 0 ? `, ${errorCount} errors` : ''}`
      })

      if (errors.length > 0) {
        logger.warn('Import completed with errors', { errors })
      }

      // Reset import state
      setShowImportDialog(false)
      setCsvFile(null)
      setCsvData([])
      setCsvHeaders([])
      setFieldMapping({})
      setIsProcessing(false)

      // Refresh profiles
      onProfilesUpdated()

      logger.info('CSV import completed', { successCount, updatedCount, errorCount })
    } catch (error) {
      logger.error('CSV import failed', { error })
      setIsProcessing(false)
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import profiles',
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      {/* Import/Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowImportDialog(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Export Profiles to CSV</h3>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                {selectedProfiles.length > 0 
                  ? `Exporting ${selectedProfiles.length} selected profiles`
                  : `Exporting all ${profiles.length} profiles`
                }
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-foreground">Select fields to export:</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2 border-border bg-background">
                {[...availableFields, ...customFields].map(field => (
                  <label key={field.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportFields.includes(field.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportFields([...exportFields, field.value])
                        } else {
                          setExportFields(exportFields.filter(f => f !== field.value))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={exportToCSV} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowExportDialog(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Import Profiles from CSV</h3>
            
            {!csvFile ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-foreground">Select CSV file:</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
                />
                <p className="text-xs text-muted-foreground mt-1">CSV should contain headers in the first row</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    File: {csvFile.name} ({csvData.length} rows)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="createSegment"
                    type="checkbox"
                    checked={createSegmentFromImport}
                    onChange={(e) => setCreateSegmentFromImport(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="createSegment" className="text-sm font-medium text-foreground">
                    Create segment from this import
                  </label>
                </div>

                {createSegmentFromImport && (
                  <div>
                    <Input
                      placeholder="Segment name"
                      value={segmentNameFromImport}
                      onChange={(e) => setSegmentNameFromImport(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      All imported profiles will be tagged with this name and grouped into a segment
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2 text-foreground">Map CSV fields to profile fields:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {csvHeaders.map(header => (
                      <div key={header} className="flex items-center gap-2">
                        <span className="text-sm w-32 truncate text-foreground" title={header}>
                          {header}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <Select
                          value={fieldMapping[header] || ''}
                          onValueChange={(value) => {
                            setFieldMapping(prev => ({
                              ...prev,
                              [header]: value
                            }))
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">Ignore this field</SelectItem>
                            {[...availableFields, ...customFields].map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              {csvFile && (
                <Button
                  onClick={importCSV}
                  disabled={isProcessing || Object.keys(fieldMapping).length === 0}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing...' : 'Import'}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false)
                  setCsvFile(null)
                  setCsvData([])
                  setCsvHeaders([])
                  setFieldMapping({})
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}