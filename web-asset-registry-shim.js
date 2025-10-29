// Web asset registry shim for React Native modules

// Mock PackagerAsset type for TypeScript compatibility
export const PackagerAsset = {};

export function getAssetByID(assetId) {
  // Return a mock asset object for web
  return {
    __packager_asset: true,
    fileSystemLocation: '/assets',
    httpServerLocation: '/assets',
    width: null,
    height: null,
    scales: [1],
    hash: assetId,
    name: `asset_${assetId}`,
    type: 'unknown',
    uri: `/assets/asset_${assetId}`
  };
}

export function registerAsset(asset) {
  // Mock registration for web
  return asset;
}

// Default export for compatibility
export default {
  getAssetByID,
  registerAsset
};