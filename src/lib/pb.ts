import PocketBase from 'pocketbase'

export const pb = new PocketBase('http://163.7.5.133:8090')

pb.autoCancellation(false)
