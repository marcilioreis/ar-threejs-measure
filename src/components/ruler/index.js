import React, { useCallback } from 'react'
import { mount } from './SessionXR'
import './styles.css'

export default function Ruler() {
    const containerRef = useCallback(mount, [])
    return <div className="ruler-container" ref={containerRef}></div>
}
