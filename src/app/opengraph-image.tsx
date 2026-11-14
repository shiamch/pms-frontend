import { ImageResponse } from 'next/og'
import { env } from '@/lib/env'
import { OgCard, ogSize } from '@/lib/og/OgCard'

export const alt = env.siteName
export const size = ogSize
export const contentType = 'image/png'

const Image = () => new ImageResponse(<OgCard />, size)

export default Image
