import { createContext } from 'react'

// Показывать ли субтитры. По умолчанию да — так рендерятся MP4 и Remotion Studio.
// На странице курса плеер выключает их, пока ролик стоит на обложке и ни разу не запускался.
export const SubtitlesShown = createContext(true)
