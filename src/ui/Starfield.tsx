import { useEffect, useRef, type ReactElement } from 'react'

type Star = {
  x: number
  y: number
  speedY: number
  radius: number
  twinklePhase: number
  twinkleSpeed: number
  color: string
}

/**
 * Fixed canvas starfield with gentle downward drift and twinkling alpha.
 * Honors prefers-reduced-motion by rendering a static field.
 */
export function Starfield(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d', { alpha: true })!

    let animationFrame = 0
    let stars: Star[] = []
    let isReduced = false
    let bgGradient: CanvasGradient | null = null
    let viewportWidth = window.innerWidth
    let viewportHeight = window.innerHeight
    let resizeQueued = false

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReduced = () => { isReduced = mql.matches }
    updateReduced()
    mql.addEventListener?.('change', updateReduced)

    function applyResize(): void {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      canvas.width = Math.floor(newWidth * dpr)
      canvas.height = Math.floor(newHeight * dpr)
      canvas.style.width = newWidth + 'px'
      canvas.style.height = newHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const area = newWidth * newHeight
      const density = 0.00012 // stars per pixel
      const targetCount = Math.min(450, Math.max(140, Math.floor(area * density)))

      // Scale existing stars to preserve relative positions
      const scaleX = viewportWidth > 0 ? newWidth / viewportWidth : 1
      const scaleY = viewportHeight > 0 ? newHeight / viewportHeight : 1
      for (const s of stars) {
        s.x *= scaleX
        s.y *= scaleY
      }

      // Adjust number of stars gradually (add/remove diff)
      if (stars.length < targetCount) {
        const toAdd = targetCount - stars.length
        for (let i = 0; i < toAdd; i++) {
          const r = Math.random()
          let color = 'rgba(255,255,255,0.9)'
          if (r >= 0.6 && r < 0.85) color = 'rgba(188, 160, 255, 0.95)'
          else if (r >= 0.85) color = 'rgba(150, 205, 255, 0.95)'
          stars.push({
            x: Math.random() * newWidth,
            y: Math.random() * newHeight,
            speedY: 20 + Math.random() * 40,
            radius: Math.random() * 1.4 + 0.4,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.3 + Math.random() * 0.7,
            color,
          })
        }
      } else if (stars.length > targetCount) {
        stars.length = targetCount
      }

      viewportWidth = newWidth
      viewportHeight = newHeight
      updateBackgroundGradient(newWidth, newHeight)
    }

    function scheduleResize(): void {
      if (resizeQueued) return
      resizeQueued = true
      requestAnimationFrame(() => {
        resizeQueued = false
        applyResize()
      })
    }

    function drawStar(s: Star, timeS: number): void {
      const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.twinklePhase + timeS * s.twinkleSpeed))
      ctx.globalAlpha = tw
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
      ctx.fillStyle = s.color
      ctx.fill()
    }

    function updateBackgroundGradient(width: number, height: number): void {
      void width; // silence unused param
      const g = ctx.createLinearGradient(0, 0, 0, height)
      g.addColorStop(0, '#0b0a15')
      g.addColorStop(0.5, '#121327')
      g.addColorStop(1, '#0b0c16')
      bgGradient = g
    }

    let lastTs = performance.now()
    function render(nowMs: number): void {
      const timeS = nowMs / 1000
      const { innerWidth, innerHeight } = window
      if (!bgGradient) updateBackgroundGradient(innerWidth, innerHeight)
      ctx.fillStyle = bgGradient!
      ctx.fillRect(0, 0, innerWidth, innerHeight)
      const dtSec = Math.min(0.1, Math.max(0.001, (nowMs - lastTs) / 1000))

      for (const s of stars) {
        drawStar(s, timeS)
        if (!isReduced) {
          s.y += s.speedY * dtSec
          if (s.y > innerHeight + 2) {
            s.y = -2
            s.x = Math.random() * innerWidth
          }
        }
      }
      lastTs = nowMs
      animationFrame = requestAnimationFrame(render)
    }

    applyResize()
    window.addEventListener('resize', scheduleResize)
    animationFrame = requestAnimationFrame(render)

    // simplified: no visibilitychange adjustments

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', scheduleResize)
      mql.removeEventListener?.('change', updateReduced)
      // no visibility listener to remove
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="starfield"
      aria-hidden="true"
    />
  )
}

export default Starfield


