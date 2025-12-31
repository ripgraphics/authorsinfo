'use client'

import type React from 'react'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DataTableProps {
  title: string
  description?: string
  columns: { key: string; label: string }[]
  data: Record<string, any>[]
  loading?: boolean
  imageField?: string
  linkField?: string
  linkPrefix?: string
}

export function DataTable({
  title,
  description,
  columns,
  data,
  loading = false,
  imageField,
  linkField,
  linkPrefix,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue === bValue) return 0
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

    return sortDirection === 'asc' ? comparison : -comparison
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {imageField && <TableHead className="w-[60px]">Image</TableHead>}
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className="cursor-pointer"
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {sortColumn === column.key && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((row, index) => (
                    <TableRow key={index}>
                      {imageField && (
                        <TableCell>
                          <div className="relative h-10 w-8 overflow-hidden rounded-sm">
                            {row[imageField]?.url ? (
                              <Image
                                src={row[imageField].url || '/placeholder.svg'}
                                alt={row[imageField].alt_text || 'Image'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {linkField && column.key === linkField && linkPrefix ? (
                            <Link href={`${linkPrefix}/${row.id}`} className="hover:underline">
                              {formatCellValue(row[column.key])}
                            </Link>
                          ) : (
                            formatCellValue(row[column.key])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (imageField ? 1 : 0)}
                      className="h-24 text-center"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'number') {
    // Format numbers with 2 decimal places if they have decimals
    return Number.isInteger(value) ? value : value.toFixed(2)
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  // Check if it's a date string
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(value).toLocaleDateString()
  }

  return value
}
