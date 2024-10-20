import { FuturSpace } from 'futurspace'

const futurspace = new FuturSpace({
  apiKey: process.env.FUTURSPACE_API_KEY,
  projectId: process.env.FUTURSPACE_PROJECT_ID,
})

export default futurspace
