import PocketBase from 'pocketbase'

// Same origin — Vite proxy forwards /api and /_ to PocketBase
export const pb = new PocketBase(window.location.origin)

pb.autoCancellation(false)
