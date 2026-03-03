'use client'

import { useCallback, useEffect, useRef } from 'react'
import { deleteImage, finalizeImageUpload, getPublicIdFromUrl } from '@/app/actions/upload'

export interface ManagedUploadAsset {
  url: string
  imageId?: string
}

export function useUploadLifecycleManager() {
  const pendingAssetsRef = useRef<Map<string, ManagedUploadAsset>>(new Map())

  const trackTemporaryUpload = useCallback((asset: ManagedUploadAsset) => {
    if (!asset?.url) return
    pendingAssetsRef.current.set(asset.url, asset)
  }, [])

  const markUploadPersisted = useCallback(async (asset: ManagedUploadAsset) => {
    if (!asset?.url) return

    pendingAssetsRef.current.delete(asset.url)

    if (asset.imageId) {
      await finalizeImageUpload(asset.imageId)
    }
  }, [])

  const markUploadsPersisted = useCallback(async (assets: ManagedUploadAsset[]) => {
    if (!assets?.length) return

    await Promise.allSettled(assets.map((asset) => markUploadPersisted(asset)))
  }, [markUploadPersisted])

  const cleanupAsset = useCallback(async (asset: ManagedUploadAsset) => {
    if (!asset?.url) return

    pendingAssetsRef.current.delete(asset.url)

    const publicId = await getPublicIdFromUrl(asset.url)
    if (!publicId) return

    await deleteImage(publicId)
  }, [])

  const cleanupAssets = useCallback(async (assets: ManagedUploadAsset[]) => {
    if (!assets?.length) return

    await Promise.allSettled(assets.map((asset) => cleanupAsset(asset)))
  }, [cleanupAsset])

  const cleanupPendingUploads = useCallback(async () => {
    const pendingAssets = Array.from(pendingAssetsRef.current.values())
    pendingAssetsRef.current.clear()

    await cleanupAssets(pendingAssets)
  }, [cleanupAssets])

  useEffect(() => {
    return () => {
      void cleanupPendingUploads()
    }
  }, [cleanupPendingUploads])

  return {
    trackTemporaryUpload,
    markUploadPersisted,
    markUploadsPersisted,
    cleanupAsset,
    cleanupAssets,
    cleanupPendingUploads,
  }
}

export default useUploadLifecycleManager
