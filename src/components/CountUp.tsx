'use client'

import { useState, useEffect } from 'react'

export default function CountUp({ end, duration = 2000 }: { readonly end: number, readonly duration?: number }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime: number | null = null
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) {
                globalThis.requestAnimationFrame(step)
            }
        }
        globalThis.requestAnimationFrame(step)
    }, [end, duration])

    return <>{count}</>
}
