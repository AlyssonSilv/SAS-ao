'use client'

import { useEffect, useRef } from 'react'

type PlantaShellProps = {
  markup: string
  simulation?: boolean
}

const dashboardScripts = ['/planta/sa-data.js', '/planta/dashboard.js']
const simulationScripts = [
  '/planta/vendor/three.min.js',
  '/planta/vendor/OrbitControls.js',
  '/planta/vendor/RoomEnvironment.js',
  '/planta/vendor/RoundedBoxGeometry.js',
  '/planta/world.js',
  '/planta/scenes.js',
  '/planta/sa-data.js',
  '/planta/engine.js',
]

export function PlantaShell({ markup, simulation = false }: PlantaShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const root = rootRef.current
    if (!root) return

    root.innerHTML = markup
    const scripts = simulation ? simulationScripts : dashboardScripts

    const loadScript = (index: number) => {
      if (cancelled || index >= scripts.length) return
      const script = document.createElement('script')
      script.src = scripts[index]
      script.dataset.plantaScript = 'true'
      script.onload = () => loadScript(index + 1)
      script.onerror = () => console.error(`Não foi possível carregar ${scripts[index]}`)
      document.body.appendChild(script)
    }

    loadScript(0)
    return () => {
      cancelled = true
      document.querySelectorAll('script[data-planta-script]').forEach((script) => script.remove())
      root.replaceChildren()
    }
  }, [markup, simulation])

  return <div ref={rootRef} className={simulation ? 'planta-root planta-simulation' : 'planta-root'} />
}
