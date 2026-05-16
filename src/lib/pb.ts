import PocketBase from 'pocketbase'

// Same origin — PocketBase serves both API and frontend
export const pb = new PocketBase(window.location.origin)

pb.autoCancellation(false)
